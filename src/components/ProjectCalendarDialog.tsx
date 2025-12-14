import { useState, useEffect } from 'react';
import { Project } from '@/types/project';
import { Task } from '@/types/task';
import { CalendarEvent } from '@/types/event';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';

interface ProjectCalendarDialogProps {
  project: Project | null;
  open: boolean;
  onClose: () => void;
  onSave: (project: Project) => void;
  tasks: Task[];
  events: CalendarEvent[];
}

interface ScheduledTask {
  taskId: string;
  scheduledDate: string;
  scheduledTime?: string;
}

export const ProjectCalendarDialog = ({ 
  project, 
  open, 
  onClose, 
  onSave, 
  tasks,
  events 
}: ProjectCalendarDialogProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([]);

  useEffect(() => {
    if (project) {
      // Load any existing scheduled tasks from project metadata
      // For now, we'll use the task's dueDate as the scheduled date
      const scheduled = tasks
        .filter(t => project.taskIds.includes(t.id) && t.dueDate)
        .map(t => ({
          taskId: t.id,
          scheduledDate: t.dueDate,
          scheduledTime: undefined,
        }));
      setScheduledTasks(scheduled);
    }
  }, [project, tasks]);

  if (!project) return null;

  const projectTasks = tasks.filter(t => project.taskIds.includes(t.id));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const daysToShow = viewMode === 'month' 
    ? eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getTasksForDay = (date: Date): Task[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return projectTasks.filter(t => {
      const scheduled = scheduledTasks.find(s => s.taskId === t.id);
      return scheduled?.scheduledDate === dateStr || t.dueDate === dateStr;
    });
  };

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => {
      if (!selectedEventIds.includes(e.id)) return false;
      if (e.endDate) {
        return dateStr >= e.date && dateStr <= e.endDate;
      }
      return e.date === dateStr;
    });
  };

  const handleScheduleTask = (taskId: string, date: Date | null, time?: string) => {
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existing = scheduledTasks.find(s => s.taskId === taskId);
      if (existing) {
        setScheduledTasks(scheduledTasks.map(s => 
          s.taskId === taskId ? { ...s, scheduledDate: dateStr, scheduledTime: time } : s
        ));
      } else {
        setScheduledTasks([...scheduledTasks, { taskId, scheduledDate: dateStr, scheduledTime: time }]);
      }
    } else {
      setScheduledTasks(scheduledTasks.filter(s => s.taskId !== taskId));
    }
  };

  const toggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSave = () => {
    // Update task due dates based on scheduled tasks
    const updatedTasks = tasks.map(task => {
      const scheduled = scheduledTasks.find(s => s.taskId === task.id);
      if (scheduled) {
        return { ...task, dueDate: scheduled.scheduledDate };
      }
      return task;
    });
    
    // Save updated tasks to localStorage
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    
    onSave(project);
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Calendar - {project.title}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4">
          {/* Events Selection Sidebar */}
          <div className="col-span-1 border-r pr-4">
            <h4 className="font-medium mb-2">Include Events</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {events.filter(e => !e.deletedAt).map(event => (
                <div key={event.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`event-${event.id}`}
                    checked={selectedEventIds.includes(event.id)}
                    onCheckedChange={() => toggleEventSelection(event.id)}
                  />
                  <Label htmlFor={`event-${event.id}`} className="text-sm cursor-pointer truncate">
                    {event.title}
                  </Label>
                </div>
              ))}
              {events.filter(e => !e.deletedAt).length === 0 && (
                <p className="text-sm text-muted-foreground">No events available</p>
              )}
            </div>

            <div className="border-t mt-4 pt-4">
              <h4 className="font-medium mb-2">Project Tasks</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {projectTasks.map(task => (
                  <div
                    key={task.id}
                    className={`text-sm p-2 rounded cursor-pointer ${
                      task.completed ? 'bg-green-500/10 line-through' : 'bg-muted'
                    }`}
                    onClick={() => {
                      if (selectedDate) {
                        handleScheduleTask(task.id, selectedDate);
                      }
                    }}
                  >
                    {task.name}
                    {scheduledTasks.find(s => s.taskId === task.id) && (
                      <Badge variant="outline" className="ml-2 text-xs">Scheduled</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div className="col-span-3">
            <Tabs defaultValue="calendar" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="calendar">
                  <Calendar className="h-4 w-4 mr-2" />
                  Calendar
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
                      const dayTasks = getTasksForDay(day);
                      const dayEvents = getEventsForDay(day);
                      const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                      const isSelected = selectedDate && isSameDay(day, selectedDate);

                      return (
                        <div
                          key={day.toISOString()}
                          className={`min-h-[70px] p-1 border rounded cursor-pointer transition-colors ${
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
                            {dayTasks.slice(0, 2).map(task => (
                              <div
                                key={task.id}
                                className={`text-xs px-1 rounded truncate ${
                                  task.completed ? 'bg-green-500/20 text-green-700 dark:text-green-300 line-through' : 'bg-primary/20 text-primary'
                                }`}
                              >
                                {task.name}
                              </div>
                            ))}
                            {(dayTasks.length > 2 || dayEvents.length > 1) && (
                              <div className="text-xs text-muted-foreground">
                                +{Math.max(0, dayTasks.length - 2) + Math.max(0, dayEvents.length - 1)} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                        {getTasksForDay(selectedDate).map(task => (
                          <div key={task.id} className="flex items-center justify-between p-2 bg-muted rounded">
                            <span className={task.completed ? 'line-through' : ''}>{task.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleScheduleTask(task.id, null)}
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
                    Set specific times for tasks to receive reminders.
                  </p>
                  <div className="space-y-2">
                    {projectTasks.map(task => {
                      const scheduled = scheduledTasks.find(s => s.taskId === task.id);
                      return (
                        <div key={task.id} className="flex items-center gap-4 p-3 border rounded">
                          <div className="flex-1">
                            <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.name}
                            </p>
                            {scheduled?.scheduledDate && (
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(scheduled.scheduledDate), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                          <input
                            type="time"
                            value={scheduled?.scheduledTime || ''}
                            onChange={(e) => {
                              if (scheduled) {
                                handleScheduleTask(task.id, new Date(scheduled.scheduledDate), e.target.value);
                              }
                            }}
                            disabled={!scheduled}
                            className="border rounded px-2 py-1 disabled:opacity-50"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

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
