import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
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

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
}

const TaskDetailsDialog = ({ task, open, onClose, onSave }: TaskDetailsDialogProps) => {
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  if (!editedTask) return null;

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  const importanceLabels = ['None', 'Low', 'Medium', 'High', 'Urgent', 'Critical'];
  const defaultCategories = ['Work', 'Study', 'Personal', 'Health', 'Projects', 'Other'];

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
            <Select
              value={editedTask.category || ''}
              onValueChange={(value) => setEditedTask({ ...editedTask, category: value })}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {defaultCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
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
