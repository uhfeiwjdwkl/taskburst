import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Project } from '@/types/project';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, FolderOpen, ChevronDown, ChevronRight, Briefcase } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskCard from '@/components/TaskCard';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import TaskDetailsViewDialog from '@/components/TaskDetailsViewDialog';
import { ExportImportButton } from '@/components/ExportImportButton';
import { toast } from 'sonner';

const Categories = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
    
    const savedProjects = localStorage.getItem('projects');
    if (savedProjects) {
      const allProjects = JSON.parse(savedProjects) as Project[];
      setProjects(allProjects.filter(p => !p.deletedAt && !p.archivedAt));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } else {
      localStorage.setItem('tasks', JSON.stringify([]));
    }
  }, [tasks]);

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    toast.success('Task updated!');
  };

  const handleStartFocus = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    toast.success(`Starting focus session for: ${task?.name}`);
    navigate('/');
  };

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const completedTask = { ...task, completed: true };
      
      const archived = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
      localStorage.setItem('archivedTasks', JSON.stringify([...archived, completedTask]));
      
      const updatedTasks = tasks.filter(t => t.id !== taskId);
      setTasks(updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      toast.success('Task completed and archived! 🎉');
    }
  };

  const handleShowDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setDetailsDialogOpen(true);
    }
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setEditDialogOpen(true);
    }
  };

  const getCategoryGroups = () => {
    const groups: { [key: string]: Task[] } = {};
    
    // Add tasks to their categories
    tasks.forEach(task => {
      const category = task.category || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(task);
    });

    // Add projects as separate entries
    projects.forEach(project => {
      const category = 'Projects';
      if (!groups[category]) {
        groups[category] = [];
      }
    });

    return groups;
  };

  const getProjectTasks = (project: Project): Task[] => {
    const allTasks = [...tasks];
    const archived = localStorage.getItem('archivedTasks');
    if (archived) {
      allTasks.push(...JSON.parse(archived));
    }
    return allTasks.filter(t => project.taskIds.includes(t.id) && !t.deletedAt);
  };

  const toggleProjectExpanded = (projectId: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const categoryGroups = getCategoryGroups();
  const categories = Object.keys(categoryGroups).sort();

  const selectedCategoryTasks = selectedCategory 
    ? categoryGroups[selectedCategory]?.sort((a, b) => b.importance - a.importance) || []
    : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Categories
              </h1>
              <p className="text-muted-foreground mt-1">
                Browse tasks by category
              </p>
            </div>
          </div>
          <ExportImportButton
            data={tasks}
            filename={`tasks-${new Date().toISOString().split('T')[0]}.json`}
            onImport={(data) => {
              setTasks(data);
              toast.success('Tasks imported successfully!');
            }}
            storageKey="tasks"
            label="All Tasks"
          />
        </header>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Categories List */}
          <Card className="p-6 md:col-span-1 h-fit">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              All Categories
            </h2>
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No categories yet. Add tasks with categories to see them here.
              </p>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      <Badge variant={selectedCategory === category ? "secondary" : "outline"}>
                        {categoryGroups[category].length}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Tasks in Selected Category */}
          <div className="md:col-span-2">
            {!selectedCategory ? (
              <Card className="p-12 text-center">
                <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">Select a Category</h3>
                <p className="text-muted-foreground">
                  Choose a category from the list to view its tasks
                </p>
              </Card>
            ) : selectedCategory === 'Projects' ? (
              <div className="space-y-4">
                <Card className="p-4">
                  <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
                    <Briefcase className="h-6 w-6" />
                    Projects
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                  </p>
                </Card>

                {projects.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No projects yet
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {projects.map((project) => {
                      const projectTasks = getProjectTasks(project);
                      const isExpanded = expandedProjects.has(project.id);

                      return (
                        <Card key={project.id}>
                          <Collapsible open={isExpanded} onOpenChange={() => toggleProjectExpanded(project.id)}>
                            <div className="p-4 cursor-pointer" onClick={() => toggleProjectExpanded(project.id)}>
                              <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </Button>
                                </CollapsibleTrigger>
                                <div>
                                  <h3 className="font-semibold">{project.title}</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {projectTasks.length} tasks • {projectTasks.filter(t => t.completed).length} completed
                                  </p>
                                </div>
                              </div>
                            </div>
                            <CollapsibleContent>
                              <div className="px-4 pb-4 space-y-2">
                                {projectTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className={`p-3 border rounded-md ${task.completed ? 'line-through opacity-70' : ''}`}
                                  >
                                    <div className="font-medium">{task.name}</div>
                                    <div className="text-sm text-muted-foreground">{task.description}</div>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <Card className="p-4">
                  <h2 className="text-2xl font-semibold mb-1">{selectedCategory}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedCategoryTasks.length} {selectedCategoryTasks.length === 1 ? 'task' : 'tasks'}
                  </p>
                </Card>

                {selectedCategoryTasks.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-muted-foreground">
                      No tasks in this category
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {selectedCategoryTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStartFocus={handleStartFocus}
                        onShowDetails={handleShowDetails}
                        onEdit={handleEdit}
                        onComplete={handleCompleteTask}
                        onDelete={(taskId) => {
                          const task = tasks.find(t => t.id === taskId);
                          if (task) {
                            const deletedTask = { ...task, deletedAt: new Date().toISOString() };
                            const deleted = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
                            localStorage.setItem('deletedTasks', JSON.stringify([...deleted, deletedTask]));
                            setTasks(tasks.filter(t => t.id !== taskId));
                            toast.success('Task moved to recently deleted');
                          }
                        }}
                        onUpdateTask={handleUpdateTask}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <TaskDetailsDialog
          task={selectedTask}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleUpdateTask}
        />

        <TaskDetailsViewDialog
          task={selectedTask}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
        />
      </div>
    </div>
  );
};

export default Categories;
