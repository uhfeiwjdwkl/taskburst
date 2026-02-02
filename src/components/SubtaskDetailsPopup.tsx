import { Subtask } from '@/types/subtask';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, Calendar as CalendarIcon, ChevronRight, Edit } from 'lucide-react';
import { formatTimeTo12Hour } from '@/lib/dateFormat';

interface SubtaskDetailsPopupProps {
  subtask: Subtask;
  onComplete: () => void;
  onUncomplete?: () => void;
  onClose: () => void;
  onViewDetails?: () => void;
  onEdit?: () => void;
  position?: 'top' | 'bottom';
}

export const SubtaskDetailsPopup = ({ 
  subtask, 
  onComplete, 
  onUncomplete,
  onClose,
  onViewDetails,
  onEdit,
  position = 'top' 
}: SubtaskDetailsPopupProps) => {
  const priorityColors: Record<number, string> = {
    1: 'bg-slate-500',
    2: 'bg-blue-500',
    3: 'bg-yellow-500',
    4: 'bg-orange-500',
    5: 'bg-red-500',
  };

  const positionClasses = position === 'top' 
    ? 'bottom-full mb-2' 
    : 'top-full mt-2';

  // Calculate remaining time
  const remainingMinutes = subtask.estimatedMinutes || 0;
  const mins = Math.floor(remainingMinutes);
  const secs = Math.round((remainingMinutes % 1) * 60);

  return (
    <div 
      className={`absolute z-[100] left-1/2 -translate-x-1/2 ${positionClasses} w-64 bg-popover border border-border rounded-lg shadow-lg p-3`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-end mb-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Remaining Time */}
      {remainingMinutes > 0 && (
        <div className="text-center mb-3 p-2 bg-muted rounded-md">
          <div className="text-lg font-bold">
            {mins}m {secs}s
          </div>
          <div className="text-xs text-muted-foreground">Estimated remaining</div>
        </div>
      )}
      
      {/* Full Name Button - opens details view (NOT edit) */}
      {onViewDetails && (
        <Button
          variant="outline"
          className="w-full justify-between mb-2 h-auto py-2"
          onClick={onViewDetails}
        >
          <span className="text-left truncate flex-1 text-sm">{subtask.title}</span>
          <ChevronRight className="h-4 w-4 flex-shrink-0 ml-2" />
        </Button>
      )}

      {!onViewDetails && (
        <p className="font-medium text-sm mb-2">{subtask.title}</p>
      )}
      
      {subtask.description && (
        <p className="text-xs text-muted-foreground mb-2">{subtask.description}</p>
      )}
      
      <div className="flex flex-wrap gap-1 mb-2">
        {subtask.priority && (
          <Badge className={`${priorityColors[subtask.priority]} text-white text-xs h-5`}>
            P{subtask.priority}
          </Badge>
        )}
        {subtask.dueDate && (
          <Badge variant="outline" className="text-xs h-5">
            <CalendarIcon className="h-2 w-2 mr-1" />
            {new Date(subtask.dueDate).toLocaleDateString('en-GB')}
          </Badge>
        )}
        {subtask.scheduledTime && (
          <Badge variant="outline" className="text-xs h-5">
            <Clock className="h-2 w-2 mr-1" />
            {formatTimeTo12Hour(subtask.scheduledTime)}
          </Badge>
        )}
      </div>
      
      {/* Complete/Uncomplete Button */}
      <div className="mt-3 space-y-2">
        {subtask.completed ? (
          onUncomplete && (
            <Button
              size="sm"
              variant="outline"
              onClick={onUncomplete}
              className="w-full h-8 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Mark Incomplete
            </Button>
          )
        ) : (
          <Button
            size="sm"
            variant="default"
            onClick={onComplete}
            className="w-full h-8 text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            Complete
          </Button>
        )}
      </div>
    </div>
  );
};
