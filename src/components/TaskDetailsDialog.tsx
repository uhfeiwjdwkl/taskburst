import { useState, useEffect, useRef } from 'react';
import { Task, TaskResult, TaskResultPart } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { saveTextBackup, createFieldId } from '@/lib/textBackup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, Calendar, Trash2, Wand2 } from 'lucide-react';
import { SubtaskList } from './SubtaskList';
import { TaskScheduleDialog } from './TaskScheduleDialog';
import { toast } from 'sonner';

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
}

const TaskDetailsDialog = ({ task, open, onClose, onSave }: TaskDetailsDialogProps) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const originalTaskRef = useRef<Task | null>(null);

  useEffect(() => {
    if (task) {
      // Ensure result has default structure
      const defaultResult: TaskResult = {
        totalScore: null,
        totalMaxScore: 100,
        totalMode: 'marks',
        parts: [
          { name: 'Part 1', score: null, maxScore: 25, notes: '' },
          { name: 'Part 2', score: null, maxScore: 25, notes: '' },
          { name: 'Part 3', score: null, maxScore: 25, notes: '' },
          { name: 'Part 4', score: null, maxScore: 25, notes: '' },
        ]
      };
      setEditedTask({ 
        ...task, 
        result: task.result || (task.showInResults ? defaultResult : undefined)
      });
      originalTaskRef.current = { ...task };
    }
  }, [task]);

  useEffect(() => {
    const saved = localStorage.getItem('taskCategories');
    if (saved) {
      setCategories(JSON.parse(saved));
    } else {
      const defaultCategories = ['Work', 'Study', 'Personal', 'Health', 'Projects', 'Other'];
      setCategories(defaultCategories);
      localStorage.setItem('taskCategories', JSON.stringify(defaultCategories));
    }
  }, []);

  if (!editedTask) return null;

  const handleSave = () => {
    const original = originalTaskRef.current;
    if (original) {
      if (original.name !== editedTask.name) {
        saveTextBackup({
          fieldId: createFieldId('task', editedTask.id, 'name'),
          fieldLabel: 'Name',
          previousContent: original.name,
          sourceType: 'task',
          sourceId: editedTask.id,
          sourceName: original.name,
        });
      }
      if (original.description !== editedTask.description) {
        saveTextBackup({
          fieldId: createFieldId('task', editedTask.id, 'description'),
          fieldLabel: 'Description',
          previousContent: original.description || '',
          sourceType: 'task',
          sourceId: editedTask.id,
          sourceName: editedTask.name,
        });
      }
      if (original.instructions !== editedTask.instructions) {
        saveTextBackup({
          fieldId: createFieldId('task', editedTask.id, 'instructions'),
          fieldLabel: 'Instructions',
          previousContent: original.instructions || '',
          sourceType: 'task',
          sourceId: editedTask.id,
          sourceName: editedTask.name,
        });
      }
    }
    onSave(editedTask);
    onClose();
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const updated = [...categories, newCategory.trim()];
      setCategories(updated);
      // Save to taskCategories (for the select dropdown)
      localStorage.setItem('taskCategories', JSON.stringify(updated));
      // Also update the main categories storage used by Categories page
      const mainCategories = JSON.parse(localStorage.getItem('categories') || '[]');
      if (!mainCategories.includes(newCategory.trim())) {
        mainCategories.push(newCategory.trim());
        localStorage.setItem('categories', JSON.stringify(mainCategories));
      }
      setEditedTask({ ...editedTask, category: newCategory.trim() });
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const handleDeleteCategory = (category: string) => {
    const updated = categories.filter(c => c !== category);
    setCategories(updated);
    localStorage.setItem('taskCategories', JSON.stringify(updated));
    if (editedTask.category === category) {
      setEditedTask({ ...editedTask, category: undefined });
    }
  };

  const handleToggleShowInResults = (checked: boolean) => {
    if (checked && !editedTask.result) {
      // Initialize result when enabling
      const defaultResult: TaskResult = {
        totalScore: null,
        totalMaxScore: 100,
        totalMode: 'marks',
        parts: [
          { name: 'Part 1', score: null, maxScore: 25, notes: '' },
          { name: 'Part 2', score: null, maxScore: 25, notes: '' },
          { name: 'Part 3', score: null, maxScore: 25, notes: '' },
          { name: 'Part 4', score: null, maxScore: 25, notes: '' },
        ]
      };
      setEditedTask({ ...editedTask, showInResults: true, result: defaultResult });
    } else {
      setEditedTask({ ...editedTask, showInResults: checked });
    }
  };

  const handlePartChange = (index: number, field: keyof TaskResultPart, value: string | number | null) => {
    if (!editedTask.result) return;
    
    const updatedParts = [...editedTask.result.parts];
    if (field === 'score') {
      updatedParts[index] = { ...updatedParts[index], score: value === '' ? null : Number(value) };
    } else if (field === 'maxScore') {
      updatedParts[index] = { ...updatedParts[index], maxScore: Number(value) || 25 };
    } else if (field === 'name') {
      updatedParts[index] = { ...updatedParts[index], name: String(value) };
    }
    
    setEditedTask({
      ...editedTask,
      result: { ...editedTask.result, parts: updatedParts }
    });
  };

  const handleAddPart = () => {
    if (!editedTask.result) return;
    
    const newPart: TaskResultPart = {
      name: `Part ${editedTask.result.parts.length + 1}`,
      score: null,
      maxScore: 25,
      notes: ''
    };
    
    setEditedTask({
      ...editedTask,
      result: { ...editedTask.result, parts: [...editedTask.result.parts, newPart] }
    });
  };

  const handleRemovePart = (index: number) => {
    if (!editedTask.result || editedTask.result.parts.length <= 1) return;
    
    const updatedParts = editedTask.result.parts.filter((_, i) => i !== index);
    setEditedTask({
      ...editedTask,
      result: { ...editedTask.result, parts: updatedParts }
    });
  };

  const importanceLabels = ['None', 'Low', 'Medium', 'High', 'Urgent', 'Critical'];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Modify task details and settings</DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Task Name</Label>
            <Input
              id="name"
              value={editedTask.name}
              onChange={(e) => setEditedTask({ ...editedTask, name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="category">Category</Label>
            {showAddCategory && (
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="New category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <Button type="button" size="sm" onClick={handleAddCategory}>Add</Button>
              </div>
            )}
            <Select
              value={editedTask.category || ''}
              onValueChange={(value) => setEditedTask({ ...editedTask, category: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <div className="border-b pb-2 mb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="w-full justify-start"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Category
                  </Button>
                </div>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{cat}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(cat);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="description">Description</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Parse bullet points from description and convert to subtasks
                  const lines = editedTask.description.split('\n');
                  const bulletRegex = /^[\s]*[-•*]\s*(.+)$/;
                  const numberedRegex = /^[\s]*\d+[.)]\s*(.+)$/;
                  
                  const newSubtasks: Subtask[] = [];
                  let hasItems = false;
                  
                  lines.forEach(line => {
                    const bulletMatch = line.match(bulletRegex);
                    const numberedMatch = line.match(numberedRegex);
                    const match = bulletMatch || numberedMatch;
                    
                    if (match && match[1].trim()) {
                      hasItems = true;
                      const title = match[1].trim();
                      // Check if subtask with this title already exists
                      const exists = (editedTask.subtasks || []).some(
                        s => s.title.toLowerCase() === title.toLowerCase()
                      );
                      if (!exists) {
                        newSubtasks.push({
                          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                          taskId: editedTask.id,
                          title,
                          completed: false,
                          linkedToProgressGrid: false,
                          createdAt: new Date().toISOString(),
                          estimatedMinutes: 0,
                        });
                      }
                    }
                  });
                  
                  if (newSubtasks.length > 0) {
                    setEditedTask({
                      ...editedTask,
                      subtasks: [...(editedTask.subtasks || []), ...newSubtasks],
                    });
                    toast.success(`Created ${newSubtasks.length} subtask(s) from description`);
                  } else if (!hasItems) {
                    toast.info('No bullet points found in description. Use - or • or * or 1. to mark items.');
                  } else {
                    toast.info('All items already exist as subtasks');
                  }
                }}
                className="h-7 px-2 text-xs"
              >
                <Wand2 className="h-3 w-3 mr-1" />
                Convert bullets to subtasks
              </Button>
            </div>
            <Textarea
              id="description"
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              className="mt-1 min-h-[100px]"
              placeholder="Add details about this task... Use - or • to list items that can be converted to subtasks"
            />
          </div>

          <div>
            <Label htmlFor="importance">
              Priority: {importanceLabels[editedTask.importance]}
            </Label>
            <Slider
              id="importance"
              value={[editedTask.importance]}
              onValueChange={([value]) => setEditedTask({ ...editedTask, importance: value })}
              min={0}
              max={5}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="estimatedMinutes">Estimated Time (minutes)</Label>
            <Input
              id="estimatedMinutes"
              type="number"
              value={editedTask.estimatedMinutes}
              onChange={(e) => setEditedTask({ 
                ...editedTask, 
                estimatedMinutes: parseInt(e.target.value) || 0 
              })}
              className="mt-1"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={editedTask.dueDate}
              onChange={(e) => setEditedTask({ ...editedTask, dueDate: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="progressGridSize">Progress Grid Size (number of squares)</Label>
            <Input
              id="progressGridSize"
              type="number"
              value={editedTask.progressGridSize}
              onChange={(e) => setEditedTask({ 
                ...editedTask, 
                progressGridSize: Math.max(1, parseInt(e.target.value) || 1),
                progressGridFilled: Math.min(editedTask.progressGridFilled, Math.max(1, parseInt(e.target.value) || 1))
              })}
              className="mt-1"
              min="1"
              max="100"
            />
          </div>

          {/* Results Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showInResults"
                checked={editedTask.showInResults || false}
                onCheckedChange={handleToggleShowInResults}
              />
              <Label htmlFor="showInResults">Show in Results page</Label>
            </div>

            {editedTask.showInResults && (
              <>
                <div>
                  <Label htmlFor="resultShortName">Short Name (for Results display)</Label>
                  <Input
                    id="resultShortName"
                    value={editedTask.resultShortName || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, resultShortName: e.target.value })}
                    className="mt-1"
                    placeholder="Optional short name"
                  />
                </div>

                {/* Total Mode Toggle */}
                <div className="flex items-center gap-2">
                  <Label>Total Mode:</Label>
                  <Button
                    type="button"
                    variant={editedTask.result?.totalMode === 'marks' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditedTask({
                      ...editedTask,
                      result: { ...editedTask.result!, totalMode: 'marks' }
                    })}
                  >
                    Sum
                  </Button>
                  <Button
                    type="button"
                    variant={editedTask.result?.totalMode === 'average' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditedTask({
                      ...editedTask,
                      result: { ...editedTask.result!, totalMode: 'average' }
                    })}
                  >
                    Average
                  </Button>
                </div>

                {/* Parts Editor */}
                {editedTask.result && (
                  <div className="space-y-2">
                    <Label>Result Parts</Label>
                    {editedTask.result.parts.map((part, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
                        <Input
                          value={part.name}
                          onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                          placeholder="Part name"
                          className="flex-1 h-8 text-sm"
                        />
                        <Input
                          type="number"
                          value={part.score ?? ''}
                          onChange={(e) => handlePartChange(index, 'score', e.target.value)}
                          placeholder="Score"
                          className="w-20 h-8 text-sm"
                        />
                        <span className="text-muted-foreground">/</span>
                        <Input
                          type="number"
                          value={part.maxScore}
                          onChange={(e) => handlePartChange(index, 'maxScore', e.target.value)}
                          className="w-16 h-8 text-sm"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleRemovePart(index)}
                          disabled={editedTask.result!.parts.length <= 1}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddPart}
                      className="w-full"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Part
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="border-t pt-4">
            <SubtaskList
              subtasks={editedTask.subtasks || []}
              taskId={editedTask.id}
              progressGridSize={editedTask.progressGridSize}
              progressGridFilled={editedTask.progressGridFilled}
              onSubtasksChange={(subtasks: Subtask[]) => setEditedTask({ ...editedTask, subtasks })}
              onProgressGridChange={(filled: number) => setEditedTask({ ...editedTask, progressGridFilled: filled })}
            />
          </div>

          <div className="pt-4 flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setScheduleDialogOpen(true)}
              className="mr-auto"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>

      <TaskScheduleDialog
        task={editedTask}
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        onSave={(updatedTask) => {
          setEditedTask(updatedTask);
          setScheduleDialogOpen(false);
        }}
      />
    </Dialog>
  );
};

export default TaskDetailsDialog;