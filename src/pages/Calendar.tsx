import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { CalendarEvent } from '@/types/event';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Calendar as CalendarIcon, Clock, MapPin, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AddTaskDialog from '@/components/AddTaskDialog';
import { AddEventDialog } from '@/components/AddEventDialog';
import { EditEventDialog } from '@/components/EditEventDialog';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import TaskDetailsViewDialog from '@/components/TaskDetailsViewDialog';
import EventDetailsViewDialog from '@/components/EventDetailsViewDialog';
import TaskCard from '@/components/TaskCard';
import { DayTimetableView } from '@/components/DayTimetableView';
import { ExportImportButton } from '@/components/ExportImportButton';
import { ExportEventButton } from '@/components/ExportEventButton';
import { ImportEventButton } from '@/components/ImportEventButton';
import { format, isSameDay, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addEventDialogOpen, setAddEventDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDetailsDialogOpen, setEventDetailsDialogOpen] = useState(false);
  const [editEventDialogOpen, setEditEventDialogOpen] = useState(false);
  const [deleteEventDialog, setDeleteEventDialog] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }

    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    } else {
      localStorage.setItem('tasks', JSON.stringify([]));
    }
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    toast.success('Task added successfully!');
  };

  const handleAddEvent = (newEvent: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const event: CalendarEvent = {
      ...newEvent,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setEvents([...events, event]);
    toast.success('Event added successfully!');
  };

  const handleDeleteEvent = () => {
    if (eventToDelete) {
      const event = events.find(e => e.id === eventToDelete);
      if (event) {
        const deletedEvent = { ...event, deletedAt: new Date().toISOString() };
        const deleted = JSON.parse(localStorage.getItem('deletedEvents') || '[]');
        localStorage.setItem('deletedEvents', JSON.stringify([...deleted, deletedEvent]));
        setEvents(events.filter(e => e.id !== eventToDelete));
        toast.success('Event moved to recently deleted');
      }
    }
    setDeleteEventDialog(false);
    setEventToDelete(null);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    toast.success('Task updated!');
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleAddTaskForDate = () => {
    setAddDialogOpen(true);
  };

  const handleAddEventForDate = () => {
    setAddEventDialogOpen(true);
  };

  const handleShowDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setDetailsDialogOpen(true);
    }
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setEditDialogOpen(true);
    }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEventDetailsDialogOpen(true);
  };

  const handleEditEvent = () => {
    setEventDetailsDialogOpen(false);
    setEditEventDialogOpen(true);
  };

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    const updatedEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    setEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
    toast.success('Event updated successfully!');
  };

  const getTasksForDate = (date: Date | undefined) => {
    if (!date) return [];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      try {
        const taskDate = parseISO(task.dueDate);
        return isSameDay(taskDate, date);
      } catch {
        return false;
      }
    });
  };

  const getEventsForDate = (date: Date | undefined) => {
    if (!date) return [];
    return events.filter(event => {
      try {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, date);
      } catch {
        return false;
      }
    });
  };

  const getDatesWithEvents = () => {
    const dates: Date[] = [];
    events.forEach(event => {
      try {
        const date = parseISO(event.date);
        dates.push(date);
      } catch {
        // Invalid date, skip
      }
    });
    return dates;
  };

  const getDatesWithTasks = () => {
    const dates: Date[] = [];
    tasks.forEach(task => {
      if (task.dueDate) {
        try {
          const date = parseISO(task.dueDate);
          dates.push(date);
        } catch {
          // Invalid date, skip
        }
      }
    });
    return dates;
  };

  const tasksForSelectedDate = getTasksForDate(selectedDate);
  const eventsForSelectedDate = getEventsForDate(selectedDate);
  const datesWithTasks = getDatesWithTasks();
  const datesWithEvents = getDatesWithEvents();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Calendar View
              </h1>
              <p className="text-muted-foreground mt-1">
                Plan your tasks by date
              </p>
            </div>
          </div>
          <ExportImportButton
            data={events}
            filename={`events-${new Date().toISOString().split('T')[0]}.json`}
            onImport={(data) => {
              if (Array.isArray(data) && data.every(item => 'title' in item && 'date' in item)) {
                const eventsWithDefaults = data.map(e => ({
                  ...e,
                  id: e.id || Date.now().toString() + Math.random(),
                  createdAt: e.createdAt || new Date().toISOString()
                }));
                setEvents(eventsWithDefaults);
                localStorage.setItem('calendarEvents', JSON.stringify(eventsWithDefaults));
                toast.success('Events imported successfully!');
              } else {
                toast.error('Invalid events file. Please upload a valid events JSON file.');
              }
            }}
            storageKey="calendarEvents"
            label="Events"
          />
        </header>

        <div className="space-y-6">
          {/* Top Section: Calendar and Tasks Side by Side */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar Section */}
            <Card className="p-6">
              <div className="mb-4 p-3 bg-muted/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  <strong>Legend:</strong> <span className="underline decoration-primary decoration-2">Underlined dates</span> have tasks • <strong className="font-bold">Bold dates</strong> have events
                </p>
              </div>
              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className={cn("pointer-events-auto")}
                  modifiers={{
                    hasTask: datesWithTasks,
                    hasEvent: datesWithEvents,
                  }}
                  modifiersStyles={{
                    hasTask: {
                      textDecoration: 'underline',
                      textDecorationColor: 'hsl(var(--primary))',
                      textDecorationThickness: '2px',
                    },
                    hasEvent: {
                      fontWeight: 'bold',
                    },
                  }}
                />
              </div>
            </Card>

            {/* Tasks for Selected Date */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tasksForSelectedDate.length} {tasksForSelectedDate.length === 1 ? 'task' : 'tasks'}, {eventsForSelectedDate.length} {eventsForSelectedDate.length === 1 ? 'event' : 'events'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAddEventForDate}
                    variant="outline"
                    disabled={!selectedDate}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Event
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddTaskForDate}
                    className="bg-gradient-primary"
                    disabled={!selectedDate}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Task
                  </Button>
                </div>
              </div>

              {!selectedDate ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select a date to view or add items
                </div>
              ) : tasksForSelectedDate.length === 0 && eventsForSelectedDate.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-3">
                    No tasks or events on this date
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button
                      size="sm"
                      onClick={handleAddEventForDate}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Event
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddTaskForDate}
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Task
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {/* Combined List */}
                  <div className="space-y-2">
                    {/* Sort by time if available, then alphabetically */}
                    {[
                      ...tasksForSelectedDate.map(t => ({ type: 'task' as const, item: t, time: null })),
                      ...eventsForSelectedDate.map(e => ({ type: 'event' as const, item: e, time: e.time }))
                    ]
                      .sort((a, b) => {
                        // Items with time come first
                        if (a.time && !b.time) return -1;
                        if (!a.time && b.time) return 1;
                        if (a.time && b.time) return a.time.localeCompare(b.time);
                        // Then by title
                        const aTitle = a.type === 'task' ? a.item.name : a.item.title;
                        const bTitle = b.type === 'task' ? b.item.name : b.item.title;
                        return aTitle.localeCompare(bTitle);
                      })
                      .map(({ type, item }) => {
                        if (type === 'task') {
                          const task = item as Task;
                          return (
                            <div key={`task-${task.id}`}>
                              <Badge variant="outline" className="mb-2 text-xs">Task</Badge>
                              <TaskCard
                                task={task}
                                onStartFocus={() => {
                                  toast.success(`Starting focus session for: ${task.name}`);
                                  navigate('/');
                                }}
                                onShowDetails={handleShowDetails}
                                onEdit={handleEdit}
                                onComplete={(taskId) => {
                                  const taskToComplete = tasks.find(t => t.id === taskId);
                                  if (taskToComplete) {
                                    const completedTask = { ...taskToComplete, completed: true };
                                    const archived = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
                                    localStorage.setItem('archivedTasks', JSON.stringify([...archived, completedTask]));
                                    const updatedTasks = tasks.filter(t => t.id !== taskId);
                                    setTasks(updatedTasks);
                                    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
                                    toast.success('Task completed and archived! 🎉');
                                  }
                                }}
                                onDelete={(taskId) => {
                                  const task = tasks.find(t => t.id === taskId);
                                  if (task) {
                                    const deletedTask = { ...task, deletedAt: new Date().toISOString() };
                                    const deleted = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
                                    localStorage.setItem('deletedTasks', JSON.stringify([...deleted, deletedTask]));
                                    const updated = tasks.filter(t => t.id !== taskId);
                                    setTasks(updated);
                                    localStorage.setItem('tasks', JSON.stringify(updated));
                                    toast.success('Task moved to recently deleted');
                                  }
                                }}
                                onUpdateTask={handleUpdateTask}
                              />
                            </div>
                          );
                        } else {
                          const event = item as CalendarEvent;
                          return (
                            <div key={`event-${event.id}`}>
                              <Badge variant="secondary" className="mb-2 text-xs">Event</Badge>
                              <Card 
                                className="p-3 cursor-pointer hover:bg-accent transition-colors"
                                onClick={() => handleEventClick(event)}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold mb-1">{event.title}</h4>
                                    {event.description && (
                                      <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                      {event.time && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {event.time}
                                          {event.duration && ` (${event.duration}m)`}
                                        </div>
                                      )}
                                      {event.location && (
                                        <div className="flex items-center gap-1">
                                          <MapPin className="h-3 w-3" />
                                          {event.location}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive h-8 w-8 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEventToDelete(event.id);
                                      setDeleteEventDialog(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                            </div>
                          );
                        }
                      })}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Bottom Section: Day Timetable Full Width */}
          {selectedDate && (
            <DayTimetableView 
              events={eventsForSelectedDate} 
              selectedDate={selectedDate}
              onEventClick={handleEventClick}
            />
          )}

          {/* Legend */}
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-2">Legend</h3>
            <div className="text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <span className="font-bold underline" style={{ textDecorationColor: 'hsl(var(--primary))' }}>
                  Dates
                </span>
                with underline have tasks due
              </p>
            </div>
          </Card>
        </div>

        <AddEventDialog
          open={addEventDialogOpen}
          onClose={() => setAddEventDialogOpen(false)}
          onAdd={handleAddEvent}
          prefilledDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
        />

        <AddTaskDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onAdd={handleAddTask}
          prefilledDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
        />

        <TaskDetailsDialog
          task={selectedTask}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleUpdateTask}
        />

        <TaskDetailsViewDialog
          task={selectedTask}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
        />

        <EventDetailsViewDialog
          event={selectedEvent}
          open={eventDetailsDialogOpen}
          onClose={() => {
            setEventDetailsDialogOpen(false);
            setSelectedEvent(null);
          }}
          onEdit={handleEditEvent}
        />

        <EditEventDialog
          event={selectedEvent}
          open={editEventDialogOpen}
          onClose={() => {
            setEditEventDialogOpen(false);
          }}
          onSave={handleUpdateEvent}
        />

        <AlertDialog open={deleteEventDialog} onOpenChange={setDeleteEventDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>
                This event will be moved to recently deleted. It will be permanently removed after 30 days.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEvent}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CalendarPage;
