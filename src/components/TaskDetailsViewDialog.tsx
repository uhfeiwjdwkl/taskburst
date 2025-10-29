import { Task } from '@/types/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Calendar as CalendarIcon, Tag } from 'lucide-react';

interface TaskDetailsViewDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

const TaskDetailsViewDialog = ({ task, open, onClose }: TaskDetailsViewDialogProps) => {
  if (!task) return null;

  const importanceLabels = ['None', 'Low', 'Medium', 'High', 'Urgent', 'Critical'];
  const remainingMinutes = Math.max(task.estimatedMinutes - task.spentMinutes, 0);
  const progressPercentage = task.estimatedMinutes > 0 
    ? Math.min((task.spentMinutes / task.estimatedMinutes) * 100, 100)
    : 0;

  // Format times in m s format
  const remainingSeconds = Math.round(remainingMinutes * 60);
  const remainingMins = Math.floor(remainingSeconds / 60);
  const remainingSecs = remainingSeconds % 60;
  
  const spentSeconds = Math.round(task.spentMinutes * 60);
  const spentMins = Math.floor(spentSeconds / 60);
  const spentSecs = spentSeconds % 60;
  const formattedSpent = `${spentMins}:${spentSecs.toString().padStart(2, '0')}`;

  const importanceColors = [
    'bg-muted text-muted-foreground',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Task Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-muted-foreground text-sm">Task Name</Label>
            <h2 className="text-xl font-semibold mt-1">{task.name}</h2>
          </div>

          {task.category && (
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Category
              </Label>
              <Badge variant="outline" className="mt-1">{task.category}</Badge>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground text-sm">Priority</Label>
            <div className="mt-1">
              <Badge className={importanceColors[task.importance]}>
                {importanceLabels[task.importance]}
              </Badge>
            </div>
          </div>

          {task.description && (
            <div>
              <Label className="text-muted-foreground text-sm">Description</Label>
              <p className="mt-1 text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time Spent
              </Label>
              <p className="mt-1 font-semibold">{spentMins}m {spentSecs}s</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time Remaining
              </Label>
              <p className="mt-1 font-semibold">{remainingMins}m {remainingSecs}s</p>
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm">Progress</Label>
            <div className="mt-2">
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formattedSpent} / {Math.round(task.estimatedMinutes)} minutes ({Math.round(progressPercentage)}%)
              </p>
            </div>
          </div>

          {task.dueDate && (
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Due Date
              </Label>
              <p className="mt-1">{new Date(task.dueDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsViewDialog;
