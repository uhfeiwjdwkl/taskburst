import { Subtask } from '@/types/subtask';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { formatTimeTo12Hour } from '@/lib/dateFormat';

interface SubtaskDetailsPopupProps {
  subtask: Subtask;
  onComplete: () => void;
  onClose: () => void;
  position?: 'top' | 'bottom';
}

export const SubtaskDetailsPopup = ({ 
  subtask, 
  onComplete, 
  onClose,
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

  return (
    <div 
      className={`absolute z-20 left-1/2 -translate-x-1/2 ${positionClasses} w-56 bg-popover border border-border rounded-lg shadow-lg p-3`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="font-medium text-sm flex-1 pr-2">{subtask.title}</p>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClose}
          className="h-6 w-6 p-0 -mt-1 -mr-1"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      
      {subtask.description && (
        <p className="text-xs text-muted-foreground mb-2">{subtask.description}</p>
      )}
      
      <div className="flex flex-wrap gap-1 mb-2">
        {subtask.priority && (
          <Badge className={`${priorityColors[subtask.priority]} text-white text-xs h-5`}>
            P{subtask.priority}
          </Badge>
        )}
        {subtask.estimatedMinutes && (
          <Badge variant="outline" className="text-xs h-5">
            <Clock className="h-2 w-2 mr-1" />
            {subtask.estimatedMinutes}m
          </Badge>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground mb-3">
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
      </div>
      
      {!subtask.completed && (
        <Button
          size="sm"
          variant="default"
          onClick={onComplete}
          className="w-full h-7 text-xs"
        >
          <Check className="h-3 w-3 mr-1" />
          Complete
        </Button>
      )}
    </div>
  );
};
