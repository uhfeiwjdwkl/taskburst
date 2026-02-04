import { Subtask } from '@/types/subtask';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Edit, Clock, Calendar as CalendarIcon, Check, Undo } from 'lucide-react';
import { formatTimeTo12Hour } from '@/lib/dateFormat';

interface SubtaskFullDetailsDialogProps {
  subtask: Subtask | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onComplete?: () => void;
  onUncomplete?: () => void;
}

export const SubtaskFullDetailsDialog = ({
  subtask,
  open,
  onClose,
  onEdit,
  onComplete,
  onUncomplete,
}: SubtaskFullDetailsDialogProps) => {
  if (!subtask) return null;

  const priorityLabels: Record<number, string> = {
    1: 'Low',
    2: 'Medium',
    3: 'High',
    4: 'Urgent',
    5: 'Critical',
  };

  const priorityColors: Record<number, string> = {
    1: 'bg-slate-500',
    2: 'bg-blue-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
  };

  const mins = Math.floor(subtask.estimatedMinutes || 0);
  const secs = Math.round(((subtask.estimatedMinutes || 0) % 1) * 60);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md"
        showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Subtask Details</DialogTitle>
            <DialogDescription>View subtask information</DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title with completion status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold flex-1">{subtask.title}</h3>
            {subtask.completed && (
              <Badge className="bg-green-500 text-white">Completed</Badge>
            )}
          </div>

          {/* Abbreviation and Color preview */}
          {(subtask.abbreviation || subtask.color) && (
            <div className="flex items-center gap-2">
              {subtask.abbreviation && (
                <Badge variant="outline">Abbrev: {subtask.abbreviation}</Badge>
              )}
              {subtask.color && (
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">Color:</span>
                  <div
                    className="w-5 h-5 rounded border border-border"
                    style={{ backgroundColor: subtask.color }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {subtask.description && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Description</span>
              <p className="text-sm mt-1">{subtask.description}</p>
            </div>
          )}

          {/* Info badges */}
          <div className="flex flex-wrap gap-2">
            {subtask.priority && (
              <Badge className={`${priorityColors[subtask.priority]} text-white`}>
                {priorityLabels[subtask.priority]} Priority
              </Badge>
            )}
            {subtask.estimatedMinutes && subtask.estimatedMinutes > 0 && (
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {mins}m {secs > 0 ? `${secs}s` : ''}
              </Badge>
            )}
          </div>

          {/* Date and Time */}
          {(subtask.dueDate || subtask.scheduledTime) && (
            <div className="flex flex-wrap gap-2">
              {subtask.dueDate && (
                <Badge variant="secondary">
                  <CalendarIcon className="h-3 w-3 mr-1" />
                  {new Date(subtask.dueDate).toLocaleDateString('en-GB')}
                </Badge>
              )}
              {subtask.scheduledTime && (
                <Badge variant="secondary">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTimeTo12Hour(subtask.scheduledTime)}
                </Badge>
              )}
            </div>
          )}

          {/* Grid link info */}
          {subtask.linkedToProgressGrid && subtask.progressGridIndex !== undefined && (
            <div className="text-sm text-muted-foreground">
              Linked to progress grid box #{subtask.progressGridIndex + 1}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 justify-end border-t pt-4">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          )}
          {subtask.completed ? (
            onUncomplete && (
              <Button variant="outline" onClick={onUncomplete}>
                <Undo className="h-4 w-4 mr-1" />
                Mark Incomplete
              </Button>
            )
          ) : (
            onComplete && (
              <Button onClick={onComplete} className="bg-gradient-primary">
                <Check className="h-4 w-4 mr-1" />
                Complete
              </Button>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
