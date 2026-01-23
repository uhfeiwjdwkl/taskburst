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
import { Plus } from 'lucide-react';
import AddTaskDialog from './AddTaskDialog';
import { ImportProjectButton } from './ImportProjectButton';

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
  const [addTaskDialogOpen, setAddTaskDialogOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [showInResults, setShowInResults] = useState(false);
  const [resultShortName, setResultShortName] = useState('');

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
      showInResults,
      resultShortName: resultShortName.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDueDateTime('');
    setNotes('');
    setSelectedTaskIds([]);
    setShowInResults(false);
    setResultShortName('');
    onClose();
  };

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: `temp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setLocalTasks([...localTasks, task]);
    setSelectedTaskIds([...selectedTaskIds, task.id]);
    
    // Save to localStorage
    const allTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    localStorage.setItem('tasks', JSON.stringify([...allTasks, task]));
    
    toast.success('Task created and added to project!');
  };

  const allAvailableTasks = [...tasks, ...localTasks];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Create New Project</span>
            <ImportProjectButton onImport={onSave} />
          </DialogTitle>
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

          {/* Results Section */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showInResults"
                checked={showInResults}
                onCheckedChange={(checked) => setShowInResults(!!checked)}
              />
              <Label htmlFor="showInResults">Show in Results page</Label>
            </div>

            {showInResults && (
              <div>
                <Label htmlFor="resultShortName">Short Name (for Results display)</Label>
                <Input
                  id="resultShortName"
                  value={resultShortName}
                  onChange={(e) => setResultShortName(e.target.value)}
                  placeholder="Optional short name"
                />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Select Tasks</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddTaskDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Create New Task
              </Button>
            </div>
            <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-2">
              {allAvailableTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks available. Create one above!</p>
              ) : (
                allAvailableTasks.map((task) => (
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
      <AddTaskDialog
        open={addTaskDialogOpen}
        onClose={() => setAddTaskDialogOpen(false)}
        onAdd={handleAddTask}
      />
    </Dialog>
  );
};