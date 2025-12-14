import { useState } from 'react';
import { Subtask } from '@/types/subtask';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Clock, Calendar, Grid3X3 } from 'lucide-react';
import { SubtaskDialog } from './SubtaskDialog';
import { formatTimeTo12Hour } from '@/lib/dateFormat';

interface SubtaskListProps {
  subtasks: Subtask[];
  taskId: string;
  progressGridSize: number;
  progressGridFilled: number;
  onSubtasksChange: (subtasks: Subtask[]) => void;
  onProgressGridChange?: (filled: number) => void;
}

export const SubtaskList = ({
  subtasks,
  taskId,
  progressGridSize,
  progressGridFilled,
  onSubtasksChange,
  onProgressGridChange
}: SubtaskListProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<Subtask | null>(null);
  const [isNew, setIsNew] = useState(false);

  // Get available grid indices (not already linked to a subtask)
  const linkedIndices = subtasks
    .filter(s => s.linkedToProgressGrid && s.progressGridIndex !== undefined)
    .map(s => s.progressGridIndex!);
  
  const availableGridIndices = Array.from({ length: progressGridSize }, (_, i) => i)
    .filter(i => !linkedIndices.includes(i) || selectedSubtask?.progressGridIndex === i);

  const handleAddSubtask = () => {
    setSelectedSubtask(null);
    setIsNew(true);
    setDialogOpen(true);
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setSelectedSubtask(subtask);
    setIsNew(false);
    setDialogOpen(true);
  };

  const handleSaveSubtask = (subtask: Subtask) => {
    let updated: Subtask[];
    if (isNew) {
      updated = [...subtasks, subtask];
    } else {
      updated = subtasks.map(s => s.id === subtask.id ? subtask : s);
    }
    onSubtasksChange(updated);
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    const updated = subtasks.filter(s => s.id !== subtaskId);
    onSubtasksChange(updated);
    
    // If linked to progress grid and was completed, decrement progress
    if (subtask?.linkedToProgressGrid && subtask.completed && onProgressGridChange) {
      onProgressGridChange(Math.max(0, progressGridFilled - 1));
    }
  };

  const handleToggleComplete = (subtaskId: string) => {
    const subtask = subtasks.find(s => s.id === subtaskId);
    if (!subtask) return;

    const wasCompleted = subtask.completed;
    const updated = subtasks.map(s => 
      s.id === subtaskId ? { ...s, completed: !s.completed } : s
    );
    onSubtasksChange(updated);

    // Update progress grid if linked
    if (subtask.linkedToProgressGrid && onProgressGridChange) {
      if (wasCompleted) {
        // Was completed, now uncompleted - decrement
        onProgressGridChange(Math.max(0, progressGridFilled - 1));
      } else {
        // Was not completed, now completed - increment
        onProgressGridChange(Math.min(progressGridSize, progressGridFilled + 1));
      }
    }
  };

  const priorityColors: Record<number, string> = {
    1: 'bg-slate-500',
    2: 'bg-blue-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Subtasks ({subtasks.length})</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddSubtask}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Subtask
        </Button>
      </div>

      {subtasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No subtasks yet. Add subtasks to break down this task.
        </p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className={`flex items-start gap-3 p-3 border rounded-lg ${
                subtask.completed ? 'bg-muted/50' : 'bg-background'
              }`}
            >
              <Checkbox
                checked={subtask.completed}
                onCheckedChange={() => handleToggleComplete(subtask.id)}
                className="mt-1"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`font-medium ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                    {subtask.title}
                  </span>
                  {subtask.priority && (
                    <Badge className={`${priorityColors[subtask.priority]} text-white text-xs`}>
                      P{subtask.priority}
                    </Badge>
                  )}
                  {subtask.linkedToProgressGrid && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Grid3X3 className="h-3 w-3" />
                      Box {(subtask.progressGridIndex ?? 0) + 1}
                    </Badge>
                  )}
                </div>
                
                {subtask.description && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {subtask.description}
                  </p>
                )}
                
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {subtask.dueDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(subtask.dueDate).toLocaleDateString('en-GB')}
                    </span>
                  )}
                  {subtask.scheduledTime && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimeTo12Hour(subtask.scheduledTime)}
                    </span>
                  )}
                  {subtask.estimatedMinutes && (
                    <span>{subtask.estimatedMinutes}min</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditSubtask(subtask)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteSubtask(subtask.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <SubtaskDialog
        subtask={selectedSubtask}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveSubtask}
        isNew={isNew}
        taskId={taskId}
        availableGridIndices={availableGridIndices}
      />
    </div>
  );
};
