import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, Calendar as CalendarIcon, Tag, Grid3X3, X, Edit } from 'lucide-react';
import ProgressRing from '@/components/ProgressRing';
import { ExportTaskButton } from '@/components/ExportTaskButton';
import { cn } from '@/lib/utils';
import { formatTimeTo12Hour } from '@/lib/dateFormat';
import { UniversalProgressGrid } from './UniversalProgressGrid';
import { SubtaskDialog } from './SubtaskDialog';

interface TaskDetailsViewDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onUpdateTask?: (task: Task) => void;
  onEdit?: (taskId: string) => void;
}

// Helper to get stored filled indices
const getStoredFilledIndices = (taskId: string): number[] | null => {
  const stored = localStorage.getItem('progressGridFilledIndices');
  if (!stored) return null;
  const data = JSON.parse(stored);
  return data[taskId] || null;
};

const storeFilledIndices = (taskId: string, indices: number[]): void => {
  const stored = localStorage.getItem('progressGridFilledIndices');
  const data = stored ? JSON.parse(stored) : {};
  data[taskId] = indices;
  localStorage.setItem('progressGridFilledIndices', JSON.stringify(data));
};

const TaskDetailsViewDialog = ({ task, open, onClose, onUpdateTask, onEdit }: TaskDetailsViewDialogProps) => {
  const [filledIndices, setFilledIndices] = useState<number[]>([]);
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [activeSubtask, setActiveSubtask] = useState<Subtask | null>(null);

  // Initialize filled indices when task changes
  useEffect(() => {
    if (task) {
      const stored = getStoredFilledIndices(task.id);
      setFilledIndices(stored || Array.from({ length: task.progressGridFilled }, (_, i) => i));
    }
  }, [task]);

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
  // filledIndices tracking is now handled by UniversalProgressGrid

  const handleToggleSubtaskCompleteFromList = (subtaskId: string) => {
    if (!onUpdateTask) return;
    const existing = (task.subtasks || []).find(s => s.id === subtaskId);
    if (!existing) return;

    const nextCompleted = !existing.completed;

    const updatedSubtasks = (task.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, completed: nextCompleted } : s
    );

    let newIndices = [...filledIndices];
    if (existing.linkedToProgressGrid && existing.progressGridIndex !== undefined) {
      const idx = existing.progressGridIndex;
      if (nextCompleted) {
        if (!newIndices.includes(idx)) newIndices = [...newIndices, idx].sort((a, b) => a - b);
      } else {
        newIndices = newIndices.filter(i => i !== idx);
      }
      storeFilledIndices(task.id, newIndices);
      setFilledIndices(newIndices);
    }

    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
      progressGridFilled: newIndices.length,
    });
  };

  const subtasks = task.subtasks || [];

  // Calculate result display
  const hasResult = task.showInResults && task.result;
  const resultTotal = hasResult ? (() => {
    const mode = task.result?.totalMode || 'marks';
    const parts = task.result?.parts || [];
    const scoredParts = parts.filter(p => p.score !== null);
    
    if (scoredParts.length === 0) return null;
    
    if (mode === 'average') {
      const avgPercentage = scoredParts.reduce((sum, p) => sum + ((p.score || 0) / p.maxScore) * 100, 0) / scoredParts.length;
      return { percentage: avgPercentage.toFixed(2), label: 'Average' };
    } else {
      const totalScore = scoredParts.reduce((sum, p) => sum + (p.score || 0), 0);
      const totalMax = scoredParts.reduce((sum, p) => sum + p.maxScore, 0);
      return { score: totalScore, max: totalMax, percentage: ((totalScore / totalMax) * 100).toFixed(2), label: 'Total' };
    }
  })() : null;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto"
        showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Task Details</DialogTitle>
            <DialogDescription>View task information and progress</DialogDescription>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={() => { onClose(); onEdit(task.id); }} className="h-8 w-8 p-0">
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
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

          {/* Progress Grid Display - Universal Component */}
          <div>
            <Label className="text-muted-foreground text-sm flex items-center gap-1">
              <Grid3X3 className="h-3 w-3" />
              Progress Grid (click to toggle)
            </Label>
            <div className="mt-2">
              <UniversalProgressGrid
                task={task}
                onUpdateTask={onUpdateTask}
                size="lg"
                showPercentage={false}
                layout="centered"
                interactive={true}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {task.progressGridFilled} / {task.progressGridSize} boxes filled
            </p>
          </div>

          <div className="flex justify-center">
            <ProgressRing
              progress={(task.progressGridFilled / task.progressGridSize) * 100}
              size={80}
              strokeWidth={8}
            />
          </div>

          {/* Result Display */}
          {hasResult && resultTotal && (
            <div className="border-t pt-4">
              <Label className="text-muted-foreground text-sm">Result</Label>
              <div className="mt-2 p-3 bg-muted rounded-md text-center">
                <div className="text-lg font-bold">
                  {resultTotal.label}: {resultTotal.score !== undefined ? `${resultTotal.score}/${resultTotal.max}` : ''} ({resultTotal.percentage}%)
                </div>
                {task.result?.parts && task.result.parts.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 justify-center">
                    {task.result.parts.map((part, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {part.name}: {part.score !== null ? `${part.score}/${part.maxScore}` : '-'}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Subtasks List */}
          {subtasks.length > 0 && (
            <div>
              <Label className="text-muted-foreground text-sm">Subtasks ({subtasks.length})</Label>
              <div className="mt-2 space-y-2 max-h-[200px] overflow-y-auto">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={cn(
                      "flex items-start gap-2 p-2 border rounded-lg text-sm cursor-pointer hover:bg-muted/50",
                      subtask.completed ? 'bg-muted/50' : 'bg-background'
                    )}
                  >
                    <Checkbox
                      checked={subtask.completed}
                      onCheckedChange={() => handleToggleSubtaskCompleteFromList(subtask.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className={subtask.completed ? 'line-through text-muted-foreground' : ''}>
                          {subtask.title}
                        </span>
                        {subtask.abbreviation && (
                          <Badge variant="secondary" className="text-xs h-4">
                            {subtask.abbreviation}
                          </Badge>
                        )}
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
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2 w-2" />
                            {subtask.estimatedMinutes}m
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSubtask(subtask);
                        setSubtaskDialogOpen(true);
                      }}
                    >
                      Details
                    </Button>
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

          <SubtaskDialog
            subtask={activeSubtask}
            open={subtaskDialogOpen}
            onClose={() => setSubtaskDialogOpen(false)}
            onSave={(saved) => {
              if (!onUpdateTask) return;
              const updated = (task.subtasks || []).some(s => s.id === saved.id)
                ? (task.subtasks || []).map(s => (s.id === saved.id ? saved : s))
                : [...(task.subtasks || []), saved];
              onUpdateTask({ ...task, subtasks: updated });
            }}
            taskId={task.id}
            availableGridIndices={Array.from({ length: task.progressGridSize }, (_, i) => i)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsViewDialog;