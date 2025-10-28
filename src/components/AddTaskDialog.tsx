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
import { Plus } from 'lucide-react';

interface AddTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  prefilledDate?: string;
}

const AddTaskDialog = ({ open, onClose, onAdd, prefilledDate }: AddTaskDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [importance, setImportance] = useState(2);
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [dueDate, setDueDate] = useState(prefilledDate || '');

  // Update dueDate when prefilledDate changes
  useEffect(() => {
    if (prefilledDate) {
      setDueDate(prefilledDate);
    }
  }, [prefilledDate]);

  const handleAdd = () => {
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      description: description.trim(),
      importance,
      estimatedMinutes,
      spentMinutes: 0,
      dueDate,
      completed: false,
    });

    // Reset form
    setName('');
    setDescription('');
    setImportance(2);
    setEstimatedMinutes(25);
    setDueDate('');
    onClose();
  };

  const importanceLabels = ['None', 'Low', 'Medium', 'High', 'Urgent', 'Critical'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="add-name">Task Name *</Label>
            <Input
              id="add-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              placeholder="Enter task name..."
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="add-description">Description</Label>
            <Textarea
              id="add-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 min-h-[100px]"
              placeholder="Add details about this task..."
            />
          </div>

          <div>
            <Label htmlFor="add-importance">
              Priority: {importanceLabels[importance]}
            </Label>
            <Slider
              id="add-importance"
              value={[importance]}
              onValueChange={([value]) => setImportance(value)}
              min={0}
              max={5}
              step={1}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="add-estimatedMinutes">Estimated Time (minutes)</Label>
            <Input
              id="add-estimatedMinutes"
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
              className="mt-1"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="add-dueDate">Due Date</Label>
            <Input
              id="add-dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleAdd} 
              className="bg-gradient-primary"
              disabled={!name.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;
