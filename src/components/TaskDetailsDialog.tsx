import { useState, useEffect, useRef } from 'react';
import { Task } from '@/types/task';
import { saveTextBackup, createFieldId } from '@/lib/textBackup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

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
  const originalTaskRef = useRef<Task | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
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
      // Save text backups for changed fields
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
      localStorage.setItem('taskCategories', JSON.stringify(updated));
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

  const importanceLabels = ['None', 'Low', 'Medium', 'High', 'Urgent', 'Critical'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedTask.description}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              className="mt-1 min-h-[100px]"
              placeholder="Add details about this task..."
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

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-primary">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsDialog;
