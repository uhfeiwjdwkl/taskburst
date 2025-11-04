import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Project } from '@/types/project';
import { Task } from '@/types/task';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface EditProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  project: Project | null;
  tasks: Task[];
}

export const EditProjectDialog = ({ open, onClose, onSave, project, tasks }: EditProjectDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || '');
      setDueDateTime(project.dueDateTime || '');
      setNotes(project.notes || '');
      setSelectedTaskIds(project.taskIds);
    }
  }, [project]);

  const handleSubmit = () => {
    if (!project) return;
    if (!title.trim()) {
      toast.error('Please enter a project title');
      return;
    }

    onSave({
      ...project,
      title: title.trim(),
      description: description.trim(),
      dueDateTime: dueDateTime || undefined,
      notes: notes.trim(),
      taskIds: selectedTaskIds,
    });

    onClose();
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  if (!project) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
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
                      {task.name} {task.completed && '(completed)'}
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
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};