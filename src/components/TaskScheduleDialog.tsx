import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { CalendarEvent } from '@/types/event';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';

interface TaskScheduleDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  events?: CalendarEvent[];
}

export const TaskScheduleDialog = ({ task, open, onClose, onSave, events = [] }: TaskScheduleDialogProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  // Auto-save on close
  const handleClose = () => {
    if (editedTask) {
      onSave(editedTask);
    }
    onClose();
  };

  if (!task || !editedTask) return null;

  const subtasks = editedTask.subtasks || [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const daysToShow = viewMode === 'month' 
    ? eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getSubtasksForDay = (date: Date): Subtask[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return subtasks.filter(s => s.dueDate === dateStr);
  };

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => {
      if (e.endDate) {
        return dateStr >= e.date && dateStr <= e.endDate;
      }
      return e.date === dateStr;
    });
  };

  const handleScheduleSubtask = (subtaskId: string, date: Date | null, time?: string, duration?: number) => {
    const updatedSubtasks = subtasks.map(s => 
      s.id === subtaskId 
        ? { 
            ...s, 
            dueDate: date ? format(date, 'yyyy-MM-dd') : undefined, 
            scheduledTime: time !== undefined ? time : s.scheduledTime,
            estimatedMinutes: duration !== undefined ? duration : s.estimatedMinutes
          }
        : s
    );
    setEditedTask({ ...editedTask, subtasks: updatedSubtasks });
  };

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  const navigatePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const selectedSubtask = subtasks.find(s => s.id === selectedSubtaskId);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Subtasks - {task.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[200px] text-center">
                {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
              </span>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {daysToShow.map(day => {
              const daySubtasks = getSubtasksForDay(day);
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-1 border rounded cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/10' : 'border-border'
                  } ${!isCurrentMonth && viewMode === 'month' ? 'opacity-50' : ''} ${
                    isToday(day) ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => setSelectedDate(day)}
                >
                  <div className="text-xs font-medium mb-1">{format(day, 'd')}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 1).map(event => (
                      <div key={event.id} className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1 rounded truncate">
                        {event.title}
                      </div>
                    ))}
                    {daySubtasks.slice(0, 2).map(subtask => (
                      <div
                        key={subtask.id}
                        className={`text-xs px-1 rounded truncate cursor-pointer ${
                          subtask.completed ? 'bg-green-500/20 text-green-700 dark:text-green-300 line-through' : 'bg-primary/20 text-primary'
                        } ${selectedSubtaskId === subtask.id ? 'ring-1 ring-primary' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSubtaskId(subtask.id);
                        }}
                      >
                        {subtask.scheduledTime && <span className="mr-1">{subtask.scheduledTime}</span>}
                        {subtask.title}
                      </div>
                    ))}
                    {(daySubtasks.length > 2 || dayEvents.length > 1) && (
                      <div className="text-xs text-muted-foreground">
                        +{daySubtasks.length - 2 + dayEvents.length - 1} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Unscheduled Subtasks */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Unscheduled Subtasks (click to select, then click a day)</h4>
            <div className="flex flex-wrap gap-2">
              {subtasks.filter(s => !s.dueDate).map(subtask => (
                <Badge
                  key={subtask.id}
                  variant={selectedSubtaskId === subtask.id ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => {
                    setSelectedSubtaskId(subtask.id);
                    if (selectedDate) {
                      handleScheduleSubtask(subtask.id, selectedDate);
                    }
                  }}
                >
                  {subtask.title}
                </Badge>
              ))}
              {subtasks.filter(s => !s.dueDate).length === 0 && (
                <p className="text-sm text-muted-foreground">All subtasks are scheduled</p>
              )}
            </div>
          </div>

          {/* Selected Day/Subtask Details with Time & Duration */}
          {(selectedDate || selectedSubtask) && (
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Selected Day Details */}
              {selectedDate && (
                <div>
                  <h4 className="font-medium mb-2">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h4>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {getEventsForDay(selectedDate).map(event => (
                      <div key={event.id} className="p-2 bg-blue-500/10 rounded text-sm">
                        <span className="font-medium">{event.title}</span>
                        {event.time && <span className="text-muted-foreground ml-2">{event.time}</span>}
                      </div>
                    ))}
                    {getSubtasksForDay(selectedDate).map(subtask => (
                      <div 
                        key={subtask.id} 
                        className={`flex items-center justify-between p-2 bg-muted rounded cursor-pointer ${
                          selectedSubtaskId === subtask.id ? 'ring-1 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedSubtaskId(subtask.id)}
                      >
                        <div>
                          <span className={subtask.completed ? 'line-through' : ''}>{subtask.title}</span>
                          {subtask.scheduledTime && (
                            <span className="text-muted-foreground text-sm ml-2">{subtask.scheduledTime}</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleScheduleSubtask(subtask.id, null);
                          }}
                        >
                          Unschedule
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Time & Duration Editor for Selected Subtask */}
              {selectedSubtask && (
                <div className="p-3 border rounded-lg bg-muted/30">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Schedule: {selectedSubtask.title}
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="subtaskDate" className="text-sm">Date</Label>
                      <Input
                        id="subtaskDate"
                        type="date"
                        value={selectedSubtask.dueDate || ''}
                        onChange={(e) => handleScheduleSubtask(
                          selectedSubtask.id, 
                          e.target.value ? new Date(e.target.value) : null
                        )}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtaskTime" className="text-sm">Time</Label>
                      <Input
                        id="subtaskTime"
                        type="time"
                        value={selectedSubtask.scheduledTime || ''}
                        onChange={(e) => handleScheduleSubtask(
                          selectedSubtask.id,
                          selectedSubtask.dueDate ? new Date(selectedSubtask.dueDate) : null,
                          e.target.value
                        )}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="subtaskDuration" className="text-sm">Duration (minutes)</Label>
                      <Input
                        id="subtaskDuration"
                        type="number"
                        min="5"
                        step="5"
                        value={selectedSubtask.estimatedMinutes || ''}
                        onChange={(e) => handleScheduleSubtask(
                          selectedSubtask.id,
                          selectedSubtask.dueDate ? new Date(selectedSubtask.dueDate) : null,
                          selectedSubtask.scheduledTime,
                          parseInt(e.target.value) || undefined
                        )}
                        placeholder="Duration"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedSubtaskId(null)}
                      className="w-full"
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={handleSave}>
            Save Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
