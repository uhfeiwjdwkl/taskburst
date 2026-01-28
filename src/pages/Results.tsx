import { useState, useEffect } from 'react';
import { Task, TaskResultPart } from '@/types/task';
import { Project, ProjectResultPart } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ResultCellDialog } from '@/components/ResultCellDialog';
import { ResultPartsEditor } from '@/components/ResultPartsEditor';
import TaskDetailsViewDialog from '@/components/TaskDetailsViewDialog';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import { Settings2, Plus, Minus, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

type ResultItem = {
  id: string;
  type: 'task' | 'project';
  name: string;
  shortName?: string;
  category: string;
  result: {
    totalScore: number | null;
    totalMaxScore: number;
    totalMode?: 'marks' | 'average';
    parts: (TaskResultPart | ProjectResultPart)[];
  };
  originalTask?: Task;
  originalProject?: Project;
};

export default function Results() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [groupBy, setGroupBy] = useState<'none' | 'category'>('none');
  const [editingCell, setEditingCell] = useState<{
    itemId: string;
    itemType: 'task' | 'project';
    partIndex: number;
  } | null>(null);
  const [partsEditorOpen, setPartsEditorOpen] = useState(false);
  const [editingPartsItem, setEditingPartsItem] = useState<ResultItem | null>(null);
  const [defaultPartCount, setDefaultPartCount] = useState(4);
  
  // Task details dialogs
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const savedTasks = localStorage.getItem('tasks');
    const savedArchivedTasks = localStorage.getItem('archivedTasks');
    const savedProjects = localStorage.getItem('projects');
    const savedArchivedProjects = localStorage.getItem('archivedProjects');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedArchivedTasks) setArchivedTasks(JSON.parse(savedArchivedTasks));
    if (savedProjects) setProjects(JSON.parse(savedProjects));
    if (savedArchivedProjects) setArchivedProjects(JSON.parse(savedArchivedProjects));
  };

  const getResultItems = (): ResultItem[] => {
    const items: ResultItem[] = [];
    
    // Combine active and archived tasks
    const allTasks = [...tasks, ...archivedTasks];
    allTasks.forEach(task => {
      if (task.showInResults) {
        const result = task.result || {
          totalScore: null,
          totalMaxScore: 100,
          totalMode: 'marks' as const,
          parts: Array.from({ length: defaultPartCount }, (_, i) => ({
            name: `Part ${i + 1}`,
            score: null,
            maxScore: 25,
            notes: ''
          }))
        };
        items.push({
          id: task.id,
          type: 'task',
          name: task.name,
          shortName: task.resultShortName,
          category: task.category || 'Uncategorized',
          result,
          originalTask: task
        });
      }
    });

    // Combine active and archived projects
    const allProjects = [...projects, ...archivedProjects];
    allProjects.forEach(project => {
      if (project.showInResults) {
        const result = project.result || {
          totalScore: null,
          totalMaxScore: 100,
          totalMode: 'marks' as const,
          parts: Array.from({ length: defaultPartCount }, (_, i) => ({
            name: `Part ${i + 1}`,
            score: null,
            maxScore: 25,
            notes: ''
          }))
        };
        items.push({
          id: project.id,
          type: 'project',
          name: project.title,
          shortName: project.resultShortName,
          category: 'Projects',
          result,
          originalProject: project
        });
      }
    });

    return items;
  };

  const resultItems = getResultItems();
  const maxParts = Math.max(defaultPartCount, ...resultItems.map(item => item.result.parts.length));

  const groupedItems = groupBy === 'category' 
    ? resultItems.reduce((acc, item) => {
        const key = item.category;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {} as Record<string, ResultItem[]>)
    : { 'All Results': resultItems };

  const calculatePercentage = (score: number | null, maxScore: number): string => {
    if (score === null) return '-';
    return ((score / maxScore) * 100).toFixed(2) + '%';
  };

  const calculateTotalScore = (item: ResultItem): { score: number | null; maxScore: number; percentage: string } => {
    const mode = item.result.totalMode || 'marks';
    const parts = item.result.parts;
    const scoredParts = parts.filter(p => p.score !== null);
    
    if (scoredParts.length === 0) return { score: null, maxScore: item.result.totalMaxScore, percentage: '-' };
    
    if (mode === 'average') {
      const avgPercentage = scoredParts.reduce((sum, p) => sum + ((p.score || 0) / p.maxScore) * 100, 0) / scoredParts.length;
      return { score: null, maxScore: 100, percentage: avgPercentage.toFixed(2) + '%' };
    } else {
      const totalScore = scoredParts.reduce((sum, p) => sum + (p.score || 0), 0);
      const totalMax = parts.reduce((sum, p) => sum + p.maxScore, 0);
      return { score: totalScore, maxScore: totalMax, percentage: ((totalScore / totalMax) * 100).toFixed(2) + '%' };
    }
  };

  // Calculate category total
  const calculateCategoryTotal = (items: ResultItem[]): { score: number | null; maxScore: number; percentage: string } => {
    const validItems = items.filter(item => {
      const total = calculateTotalScore(item);
      return total.score !== null || total.percentage !== '-';
    });
    
    if (validItems.length === 0) return { score: null, maxScore: 0, percentage: '-' };
    
    // Calculate average of percentages
    const percentages = validItems.map(item => {
      const total = calculateTotalScore(item);
      return parseFloat(total.percentage.replace('%', '')) || 0;
    });
    
    const avgPercentage = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;
    return { score: null, maxScore: 100, percentage: avgPercentage.toFixed(2) + '%' };
  };

  // Calculate global average
  const calculateGlobalAverage = (): { percentage: string; categories: { name: string; percentage: string }[] } => {
    const categories: { name: string; percentage: string }[] = [];
    
    Object.entries(groupedItems).forEach(([groupName, items]) => {
      const total = calculateCategoryTotal(items);
      if (total.percentage !== '-') {
        categories.push({ name: groupName, percentage: total.percentage });
      }
    });
    
    if (categories.length === 0) return { percentage: '-', categories: [] };
    
    const avgPercentage = categories.reduce((sum, c) => sum + parseFloat(c.percentage.replace('%', '')), 0) / categories.length;
    return { percentage: avgPercentage.toFixed(2) + '%', categories };
  };

  const globalAvg = calculateGlobalAverage();

  const handleCellClick = (itemId: string, itemType: 'task' | 'project', partIndex: number) => {
    setEditingCell({ itemId, itemType, partIndex });
  };

  const handleViewTask = (item: ResultItem) => {
    if (item.type === 'task' && item.originalTask) {
      setViewingTask(item.originalTask);
      setDetailsDialogOpen(true);
    }
  };

  const handleEditTask = (taskId: string) => {
    const task = [...tasks, ...archivedTasks].find(t => t.id === taskId);
    if (task) {
      setViewingTask(task);
      setDetailsDialogOpen(false);
      setEditDialogOpen(true);
    }
  };

  const handleUpdateTask = (updatedTask: Task) => {
    // Update in active tasks
    const newTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(newTasks);
    localStorage.setItem('tasks', JSON.stringify(newTasks));
    
    // Also check archived
    const newArchivedTasks = archivedTasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setArchivedTasks(newArchivedTasks);
    localStorage.setItem('archivedTasks', JSON.stringify(newArchivedTasks));
    
    toast.success('Task updated');
  };

  const handleCellSave = (score: number | null, maxScore: number, notes: string) => {
    if (!editingCell) return;

    const { itemId, itemType, partIndex } = editingCell;

    if (itemType === 'task') {
      const updateTasks = (taskList: Task[]) => taskList.map(task => {
        if (task.id === itemId) {
          const result = task.result || {
            totalScore: null,
            totalMaxScore: 100,
            totalMode: 'marks' as const,
            parts: Array.from({ length: defaultPartCount }, (_, i) => ({
              name: `Part ${i + 1}`,
              score: null,
              maxScore: 25,
              notes: ''
            }))
          };
          result.parts[partIndex] = { ...result.parts[partIndex], score, maxScore, notes };
          return { ...task, result };
        }
        return task;
      });

      const newTasks = updateTasks(tasks);
      const newArchivedTasks = updateTasks(archivedTasks);
      setTasks(newTasks);
      setArchivedTasks(newArchivedTasks);
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      localStorage.setItem('archivedTasks', JSON.stringify(newArchivedTasks));
    } else {
      const updateProjects = (projectList: Project[]) => projectList.map(project => {
        if (project.id === itemId) {
          const result = project.result || {
            totalScore: null,
            totalMaxScore: 100,
            totalMode: 'marks' as const,
            parts: Array.from({ length: defaultPartCount }, (_, i) => ({
              name: `Part ${i + 1}`,
              score: null,
              maxScore: 25,
              notes: ''
            }))
          };
          result.parts[partIndex] = { ...result.parts[partIndex], score, maxScore, notes };
          return { ...project, result };
        }
        return project;
      });

      const newProjects = updateProjects(projects);
      const newArchivedProjects = updateProjects(archivedProjects);
      setProjects(newProjects);
      setArchivedProjects(newArchivedProjects);
      localStorage.setItem('projects', JSON.stringify(newProjects));
      localStorage.setItem('archivedProjects', JSON.stringify(newArchivedProjects));
    }

    setEditingCell(null);
  };

  const handleEditParts = (item: ResultItem) => {
    setEditingPartsItem(item);
    setPartsEditorOpen(true);
  };

  const handleToggleTotalMode = (item: ResultItem) => {
    const newMode: 'marks' | 'average' = item.result.totalMode === 'average' ? 'marks' : 'average';
    
    if (item.type === 'task') {
      const updateTasks = (taskList: Task[]): Task[] => taskList.map(task => {
        if (task.id === item.id) {
          const result = task.result || {
            totalScore: null,
            totalMaxScore: 100,
            parts: []
          };
          return { ...task, result: { ...result, totalMode: newMode } };
        }
        return task;
      });

      const newTasks = updateTasks(tasks);
      const newArchivedTasks = updateTasks(archivedTasks);
      setTasks(newTasks);
      setArchivedTasks(newArchivedTasks);
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      localStorage.setItem('archivedTasks', JSON.stringify(newArchivedTasks));
    } else {
      const updateProjects = (projectList: Project[]) => projectList.map(project => {
        if (project.id === item.id) {
          const result = project.result || {
            totalScore: null,
            totalMaxScore: 100,
            parts: []
          };
          return { ...project, result: { ...result, totalMode: newMode } };
        }
        return project;
      });

      const newProjects = updateProjects(projects);
      const newArchivedProjects = updateProjects(archivedProjects);
      setProjects(newProjects);
      setArchivedProjects(newArchivedProjects);
      localStorage.setItem('projects', JSON.stringify(newProjects));
      localStorage.setItem('archivedProjects', JSON.stringify(newArchivedProjects));
    }
  };

  const handlePartsSave = (parts: (TaskResultPart | ProjectResultPart)[]) => {
    if (!editingPartsItem) return;

    const { id, type } = editingPartsItem;

    if (type === 'task') {
      const updateTasks = (taskList: Task[]) => taskList.map(task => {
        if (task.id === id) {
          const result = task.result || { totalScore: null, totalMaxScore: 100, parts: [] };
          return { ...task, result: { ...result, parts } };
        }
        return task;
      });

      const newTasks = updateTasks(tasks);
      const newArchivedTasks = updateTasks(archivedTasks);
      setTasks(newTasks);
      setArchivedTasks(newArchivedTasks);
      localStorage.setItem('tasks', JSON.stringify(newTasks));
      localStorage.setItem('archivedTasks', JSON.stringify(newArchivedTasks));
    } else {
      const updateProjects = (projectList: Project[]) => projectList.map(project => {
        if (project.id === id) {
          const result = project.result || { totalScore: null, totalMaxScore: 100, parts: [] };
          return { ...project, result: { ...result, parts } };
        }
        return project;
      });

      const newProjects = updateProjects(projects);
      const newArchivedProjects = updateProjects(archivedProjects);
      setProjects(newProjects);
      setArchivedProjects(newArchivedProjects);
      localStorage.setItem('projects', JSON.stringify(newProjects));
      localStorage.setItem('archivedProjects', JSON.stringify(newArchivedProjects));
    }

    setPartsEditorOpen(false);
    setEditingPartsItem(null);
  };

  const getCurrentCellData = () => {
    if (!editingCell) return null;
    const item = resultItems.find(i => i.id === editingCell.itemId);
    if (!item) return null;
    const part = item.result.parts[editingCell.partIndex];
    return part || { name: `Part ${editingCell.partIndex + 1}`, score: null, maxScore: 25, notes: '' };
  };

  // Get part column names from items
  const getPartColumnNames = (): string[] => {
    const names: string[] = [];
    for (let i = 0; i < maxParts; i++) {
      // Find a part name from any item that has this part
      const itemWithPart = resultItems.find(item => item.result.parts[i]?.name);
      names.push(itemWithPart?.result.parts[i]?.name || `Part ${i + 1}`);
    }
    return names;
  };

  const partColumnNames = getPartColumnNames();

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Results</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Default parts:</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDefaultPartCount(Math.max(1, defaultPartCount - 1))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center">{defaultPartCount}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setDefaultPartCount(Math.min(10, defaultPartCount + 1))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as 'none' | 'category')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No grouping</SelectItem>
              <SelectItem value="category">By Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global Average Summary */}
      {resultItems.length > 0 && (
        <Card className="mb-6 p-4">
          <h2 className="text-lg font-semibold mb-3">Global Summary</h2>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="text-center p-3 bg-gradient-primary text-primary-foreground rounded-lg">
              <div className="text-2xl font-bold">{globalAvg.percentage}</div>
              <div className="text-xs opacity-80">Overall Average</div>
            </div>
            {globalAvg.categories.map((cat) => (
              <div key={cat.name} className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-bold">{cat.percentage}</div>
                <div className="text-xs text-muted-foreground">{cat.name}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {resultItems.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">
            No results to display. Enable "Show in Results" on tasks or projects to see them here.
          </p>
        </Card>
      ) : (
        Object.entries(groupedItems).map(([groupName, items]) => {
          const categoryTotal = calculateCategoryTotal(items);
          return (
            <Card key={groupName} className="mb-6 overflow-hidden">
              {groupBy === 'category' && (
                <div className="bg-muted px-4 py-2 font-semibold border-b flex items-center justify-between">
                  <span>{groupName}</span>
                  <Badge variant="secondary" className="text-sm">
                    Category Avg: {categoryTotal.percentage}
                  </Badge>
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Name</TableHead>
                      <TableHead className="text-center min-w-[120px]">Total</TableHead>
                      {partColumnNames.map((name, i) => (
                        <TableHead key={i} className="text-center min-w-[120px]">
                          {name}
                        </TableHead>
                      ))}
                      <TableHead className="w-20"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const total = calculateTotalScore(item);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <div 
                              className="cursor-pointer hover:text-primary transition-colors"
                              onClick={() => handleViewTask(item)}
                            >
                              <span>{item.shortName || item.name}</span>
                              {item.shortName && (
                                <span className="text-xs text-muted-foreground block">
                                  {item.name}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell 
                            className="text-center cursor-pointer hover:bg-muted/50"
                            onClick={() => handleToggleTotalMode(item)}
                            title="Click to toggle between marks and average mode"
                          >
                            <div className="text-sm font-medium">
                              {total.score !== null ? `${total.score}/${total.maxScore}` : ''}
                              <Badge variant="outline" className="ml-1 text-xs">
                                {item.result.totalMode === 'average' ? 'Avg' : 'Sum'}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {total.percentage}
                            </div>
                          </TableCell>
                          {Array.from({ length: maxParts }, (_, i) => {
                            const part = item.result.parts[i];
                            return (
                              <TableCell
                                key={i}
                                className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => handleCellClick(item.id, item.type, i)}
                              >
                                {part ? (
                                  <div>
                                    <div className="text-sm font-medium">
                                      {part.score !== null ? `${part.score}/${part.maxScore}` : '-'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {calculatePercentage(part.score, part.maxScore)}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                                      {part.name}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            <div className="flex gap-1">
                              {item.type === 'task' && item.originalTask && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleViewTask(item)}
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditParts(item)}
                                title="Edit parts"
                              >
                                <Settings2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          );
        })
      )}

      <ResultCellDialog
        open={editingCell !== null}
        onClose={() => setEditingCell(null)}
        onSave={handleCellSave}
        initialData={getCurrentCellData()}
      />

      <ResultPartsEditor
        open={partsEditorOpen}
        onClose={() => {
          setPartsEditorOpen(false);
          setEditingPartsItem(null);
        }}
        onSave={handlePartsSave}
        parts={editingPartsItem?.result.parts || []}
        itemName={editingPartsItem?.name || ''}
      />

      <TaskDetailsViewDialog
        task={viewingTask}
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        onUpdateTask={handleUpdateTask}
        onEdit={handleEditTask}
      />

      <TaskDetailsDialog
        task={viewingTask}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleUpdateTask}
      />
    </div>
  );
}