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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

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

  const handleScheduleSubtask = (subtaskId: string, date: Date | null, time?: string) => {
    const updatedSubtasks = subtasks.map(s => 
      s.id === subtaskId 
        ? { ...s, dueDate: date ? format(date, 'yyyy-MM-dd') : undefined, scheduledTime: time || s.scheduledTime }
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Subtasks - {task.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="time">
              <Clock className="h-4 w-4 mr-2" />
              Time Schedule
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-4">
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
                            className={`text-xs px-1 rounded truncate ${
                              subtask.completed ? 'bg-green-500/20 text-green-700 dark:text-green-300 line-through' : 'bg-primary/20 text-primary'
                            }`}
                          >
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
                <h4 className="font-medium mb-2">Unscheduled Subtasks (drag to calendar or click to schedule)</h4>
                <div className="flex flex-wrap gap-2">
                  {subtasks.filter(s => !s.dueDate).map(subtask => (
                    <Badge
                      key={subtask.id}
                      variant="outline"
                      className="cursor-pointer hover:bg-primary/10"
                      onClick={() => {
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

              {/* Selected Date Details */}
              {selectedDate && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h4>
                  <div className="space-y-2">
                    {getEventsForDay(selectedDate).map(event => (
                      <div key={event.id} className="p-2 bg-blue-500/10 rounded text-sm">
                        <span className="font-medium">{event.title}</span>
                        {event.time && <span className="text-muted-foreground ml-2">{event.time}</span>}
                      </div>
                    ))}
                    {getSubtasksForDay(selectedDate).map(subtask => (
                      <div key={subtask.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div>
                          <span className={subtask.completed ? 'line-through' : ''}>{subtask.title}</span>
                          {subtask.scheduledTime && (
                            <span className="text-muted-foreground text-sm ml-2">{subtask.scheduledTime}</span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleScheduleSubtask(subtask.id, null)}
                        >
                          Unschedule
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="time" className="mt-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set specific times for subtasks to receive reminders and see them on your home screen.
              </p>
              <div className="space-y-2">
                {subtasks.map(subtask => (
                  <div key={subtask.id} className="flex items-center gap-4 p-3 border rounded">
                    <div className="flex-1">
                      <p className={`font-medium ${subtask.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {subtask.title}
                      </p>
                      {subtask.dueDate && (
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(subtask.dueDate), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <input
                      type="time"
                      value={subtask.scheduledTime || ''}
                      onChange={(e) => handleScheduleSubtask(subtask.id, subtask.dueDate ? new Date(subtask.dueDate) : null, e.target.value)}
                      className="border rounded px-2 py-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Schedule
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
