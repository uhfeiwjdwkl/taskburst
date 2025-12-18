import { useState } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Calendar as CalendarIcon, Tag, Grid3X3, Check, X } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import { ExportTaskButton } from '@/components/ExportTaskButton';
import { cn } from '@/lib/utils';
import { formatTimeTo12Hour } from '@/lib/dateFormat';

interface TaskDetailsViewDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
}

// Helper to get stored filled indices
const getStoredFilledIndices = (taskId: string): number[] | null => {
  const stored = localStorage.getItem('progressGridFilledIndices');
  if (!stored) return null;
  const data = JSON.parse(stored);
  return data[taskId] || null;
};

const TaskDetailsViewDialog = ({ task, open, onClose }: TaskDetailsViewDialogProps) => {
  const [selectedBox, setSelectedBox] = useState<number | null>(null);

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

  const priorityColors: Record<number, string> = {
    1: 'bg-slate-500',
    2: 'bg-blue-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
  };

  // Get filled indices from localStorage
  const filledIndices = getStoredFilledIndices(task.id) || 
    Array.from({ length: task.progressGridFilled }, (_, i) => i);

  // Get subtask for a specific grid index
  const getSubtaskForIndex = (index: number): Subtask | undefined => {
    return task.subtasks?.find(s => s.linkedToProgressGrid && s.progressGridIndex === index);
  };

  const subtasks = task.subtasks || [];

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

          {/* Progress Grid Display */}
          <div>
            <Label className="text-muted-foreground text-sm flex items-center gap-1">
              <Grid3X3 className="h-3 w-3" />
              Progress Grid
            </Label>
            <div className="mt-2 flex flex-wrap gap-1 justify-center">
              {Array.from({ length: task.progressGridSize }).map((_, index) => {
                const subtask = getSubtaskForIndex(index);
                const isFilled = filledIndices.includes(index);
                const isSelected = selectedBox === index;
                
                return (
                  <div key={index} className="relative">
                    <button
                      onClick={() => {
                        if (subtask && !subtask.completed) {
                          setSelectedBox(isSelected ? null : index);
                        }
                      }}
                      className={cn(
                        "w-7 h-7 border border-border rounded-sm transition-all flex items-center justify-center text-xs font-medium",
                        isFilled
                          ? "bg-gradient-primary text-primary-foreground"
                          : "bg-secondary",
                        subtask && !subtask.completed && !isFilled && "ring-2 ring-primary/50",
                        isSelected && "ring-2 ring-primary"
                      )}
                      title={subtask ? subtask.title : `Box ${index + 1}`}
                    >
                      {subtask && !isFilled ? (
                        <span className="truncate px-0.5">{subtask.title.charAt(0).toUpperCase()}</span>
                      ) : null}
                    </button>
                    
                    {/* Subtask popup */}
                    {isSelected && subtask && !subtask.completed && (
                      <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-popover border border-border rounded-lg shadow-lg p-2">
                        <p className="font-medium text-xs mb-1">{subtask.title}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedBox(null)}
                          className="h-6 text-xs w-full"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Close
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {filledIndices.length} / {task.progressGridSize} boxes filled
            </p>
          </div>

          <div className="flex justify-center">
            <ProgressRing
              progress={(task.progressGridFilled / task.progressGridSize) * 100}
              size={80}
              strokeWidth={8}
            />
          </div>

          {/* Subtasks List */}
          {subtasks.length > 0 && (
            <div>
              <Label className="text-muted-foreground text-sm">Subtasks ({subtasks.length})</Label>
              <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`flex items-start gap-2 p-2 border rounded-lg text-sm ${
                      subtask.completed ? 'bg-muted/50' : 'bg-background'
                    }`}
                  >
                    <Checkbox
                      checked={subtask.completed}
                      disabled
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                          {subtask.title}
                        </span>
                        {subtask.priority && (
                          <Badge className={`${priorityColors[subtask.priority]} text-white text-xs h-4`}>
                            P{subtask.priority}
                          </Badge>
                        )}
                        {subtask.linkedToProgressGrid && (
                          <Badge variant="outline" className="text-xs h-4">
                            <Grid3X3 className="h-2 w-2 mr-0.5" />
                            {(subtask.progressGridIndex ?? 0) + 1}
                          </Badge>
                        )}
                      </div>
                      {subtask.description && (
                        <p className="text-xs text-muted-foreground truncate">{subtask.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {subtask.dueDate && (
                          <span className="flex items-center gap-0.5">
                            <CalendarIcon className="h-2 w-2" />
                            {new Date(subtask.dueDate).toLocaleDateString('en-GB')}
                          </span>
                        )}
                        {subtask.scheduledTime && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2 w-2" />
                            {formatTimeTo12Hour(subtask.scheduledTime)}
                          </span>
                        )}
                        {subtask.estimatedMinutes && (
                          <span>{subtask.estimatedMinutes}min</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {task.dueDate && (
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                Due Date
              </Label>
              <p className="mt-1">{new Date(task.dueDate).toLocaleDateString('en-GB', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          )}

          <div className="pt-4 flex gap-2 justify-end">
            <ExportTaskButton task={task} />
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
