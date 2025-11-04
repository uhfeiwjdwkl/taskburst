import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/types/project';
import { Task } from '@/types/task';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface AddProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'createdAt' | 'order'>) => void;
  tasks: Task[];
}

export const AddProjectDialog = ({ open, onClose, onSave, tasks }: AddProjectDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      dueDateTime: dueDateTime || undefined,
      favorite: false,
      notes: notes.trim(),
      taskIds: selectedTaskIds,
      totalEstimatedMinutes: 0,
      totalSpentMinutes: 0,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDueDateTime('');
    setNotes('');
    setSelectedTaskIds([]);
    onClose();
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the project"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="dueDateTime">Due Date & Time</Label>
            <Input
              id="dueDateTime"
              type="datetime-local"
              value={dueDateTime}
              onChange={(e) => setDueDateTime(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes or details"
              rows={3}
            />
          </div>

          <div>
            <Label>Select Tasks</Label>
            <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-2">
              {tasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks available</p>
              ) : (
                tasks.map((task) => (
                  <div key={task.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`task-${task.id}`}
                      checked={selectedTaskIds.includes(task.id)}
                      onCheckedChange={() => toggleTaskSelection(task.id)}
                    />
                    <label
                      htmlFor={`task-${task.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {task.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};