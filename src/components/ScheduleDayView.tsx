import { useMemo } from 'react';
import { Subtask } from '@/types/subtask';
import { CalendarEvent } from '@/types/event';
import { Task } from '@/types/task';
import { cn } from '@/lib/utils';
import { formatTimeTo12Hour } from '@/lib/dateFormat';

interface ScheduleDayViewProps {
  date: Date;
  subtasks: Subtask[];
  events: CalendarEvent[];
  tasks?: Task[];
  onSubtaskClick?: (subtask: Subtask) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onTaskClick?: (task: Task) => void;
}

export const ScheduleDayView = ({ 
  date, 
  subtasks, 
  events,
  tasks = [],
  onSubtaskClick,
  onEventClick,
  onTaskClick
}: ScheduleDayViewProps) => {
  // Hours from 6am to 10pm
  const hours = Array.from({ length: 17 }, (_, i) => i + 6);
  
  // All day items (subtasks/events without time, and tasks due on this day)
  const allDaySubtasks = subtasks.filter(s => !s.scheduledTime);
  const allDayEvents = events.filter(e => !e.time);
  const allDayTasks = tasks; // Tasks passed in are already filtered for this date
  
  // Timed items
  const timedSubtasks = subtasks.filter(s => s.scheduledTime);
  const timedEvents = events.filter(e => e.time);

  const getTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours - 6) * 60 + minutes) / (17 * 60) * 100;
  };

  const getHeightForDuration = (minutes: number): number => {
    return (minutes / (17 * 60)) * 100;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* All Day Section - Tasks Due, Events, and Subtasks */}
      {(allDayTasks.length > 0 || allDaySubtasks.length > 0 || allDayEvents.length > 0) && (
        <div className="border-b bg-muted/30 p-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">All Day</div>
          <div className="flex flex-wrap gap-1">
            {/* Tasks due on this day */}
            {allDayTasks.map(task => (
              <div
                key={`task-${task.id}`}
                onClick={() => onTaskClick?.(task)}
                className={cn(
                  "text-xs px-2 py-1 rounded cursor-pointer",
                  task.completed 
                    ? "bg-green-500/20 text-green-700 dark:text-green-300 line-through" 
                    : "bg-orange-500/20 text-orange-700 dark:text-orange-300 hover:bg-orange-500/30"
                )}
              >
                📋 {task.name}
              </div>
            ))}
            {allDayEvents.map(event => (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 cursor-pointer hover:bg-blue-500/30"
              >
                {event.title}
              </div>
            ))}
            {allDaySubtasks.map(subtask => (
              <div
                key={subtask.id}
                onClick={() => onSubtaskClick?.(subtask)}
                className={cn(
                  "text-xs px-2 py-1 rounded cursor-pointer",
                  subtask.completed 
                    ? "bg-green-500/20 text-green-700 dark:text-green-300 line-through" 
                    : "bg-primary/20 text-primary hover:bg-primary/30"
                )}
              >
                {subtask.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Grid */}
      <div className="relative" style={{ height: '400px' }}>
        {/* Hour lines */}
        {hours.map((hour, index) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-border flex"
            style={{ top: `${(index / 17) * 100}%` }}
          >
            <div className="w-12 text-xs text-muted-foreground pr-2 text-right -mt-2 bg-background">
              {hour.toString().padStart(2, '0')}:00
            </div>
            <div className="flex-1" />
          </div>
        ))}

        {/* Timed Events */}
        <div className="absolute left-14 right-2 top-0 bottom-0">
          {timedEvents.map(event => {
            const top = getTimePosition(event.time!);
            const height = getHeightForDuration(event.duration || 60);
            return (
              <div
                key={event.id}
                onClick={() => onEventClick?.(event)}
                className="absolute left-0 right-1/2 bg-blue-500/30 border-l-2 border-blue-500 rounded-r px-2 py-1 cursor-pointer hover:bg-blue-500/40 overflow-hidden"
                style={{ top: `${top}%`, height: `${Math.max(height, 3)}%` }}
              >
                <div className="text-xs font-medium truncate">{event.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeTo12Hour(event.time!)}
                </div>
              </div>
            );
          })}

          {/* Timed Subtasks */}
          {timedSubtasks.map(subtask => {
            const top = getTimePosition(subtask.scheduledTime!);
            const height = getHeightForDuration(subtask.estimatedMinutes || 60);
            return (
              <div
                key={subtask.id}
                onClick={() => onSubtaskClick?.(subtask)}
                className={cn(
                  "absolute left-1/2 right-0 border-l-2 rounded-r px-2 py-1 cursor-pointer overflow-hidden",
                  subtask.completed 
                    ? "bg-green-500/30 border-green-500 line-through" 
                    : "bg-primary/30 border-primary hover:bg-primary/40"
                )}
                style={{ 
                  top: `${top}%`, 
                  height: `${Math.max(height, 3)}%`,
                  backgroundColor: subtask.color ? `${subtask.color}30` : undefined,
                  borderColor: subtask.color || undefined,
                }}
              >
                <div className="text-xs font-medium truncate">{subtask.title}</div>
                <div className="text-xs text-muted-foreground">
                  {formatTimeTo12Hour(subtask.scheduledTime!)}
                  {subtask.estimatedMinutes && ` • ${subtask.estimatedMinutes}m`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
