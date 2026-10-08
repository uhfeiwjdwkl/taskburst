import { eventTimingLabel } from '@/lib/eventTiming';
import { deleteStoredEntity, removeSubtask } from '@/lib/itemDeletion';
import { List as TaskList } from '@/types/list';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { CalendarEvent } from '@/types/event';
import { Assessment } from '@/types/assessment';
import { FlexibleEvent } from '@/types/timetable';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Calendar as CalendarIcon, Clock, MapPin, Trash2, ChevronDown, ChevronRight, Search, CheckCircle, Move } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Timetable } from '@/types/timetable';
import { cn } from '@/lib/utils';
import AddTaskDialog from '@/components/AddTaskDialog';
import { AddEventDialog } from '@/components/AddEventDialog';
import { EditEventDialog } from '@/components/EditEventDialog';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import TaskDetailsViewDialog from '@/components/TaskDetailsViewDialog';
import EventDetailsViewDialog from '@/components/EventDetailsViewDialog';
import { SubtaskFullDetailsDialog } from '@/components/SubtaskFullDetailsDialog';
import { AssessmentDetailsDialog } from '@/components/AssessmentDetailsDialog';
import { FlexibleEventDetailsDialog } from '@/components/FlexibleEventDetailsDialog';
import TaskCard from '@/components/TaskCard';
import { UniversalDayCalendar } from '@/components/UniversalDayCalendar';
import { ExportImportButton } from '@/components/ExportImportButton';
import { ExportDayPlanDialog } from '@/components/ExportDayPlanDialog';
import { Download } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { format, isSameDay, parseISO, isAfter, startOfDay } from 'date-fns';
import { formatTimeTo12Hour } from '@/lib/dateFormat';
import { eventOccursOnDate, getEventDatesForRange } from '@/lib/eventUtils';
import { toast } from 'sonner';
import { PlannerRangeDialog } from '@/components/PlannerRangeDialog';
import { loadPartialSlots, savePartialSlots } from '@/lib/partialSchedule';
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

const safeParse = (key: string): any[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const CalendarPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>(() => safeParse('tasks') as Task[]);
  const [events, setEvents] = useState<CalendarEvent[]>(() => safeParse('calendarEvents') as CalendarEvent[]);
  const tasksMountedRef = useRef(false);
  const eventsMountedRef = useRef(false);
  const [lists, setLists] = useState<TaskList[]>(() => safeParse('lists') as TaskList[]);
  const [partialSlots, setPartialSlots] = useState(loadPartialSlots);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableIdState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    return localStorage.getItem('calendarSelectedTimetableId') || 'all';
  });
  const setSelectedTimetableId = (id: string) => {
    setSelectedTimetableIdState(id);
    localStorage.setItem('calendarSelectedTimetableId', id);
    window.dispatchEvent(new Event('calendarSelectedTimetableIdChange'));
  };
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [exportDayOpen, setExportDayOpen] = useState(false);
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
  
  // Subtask details
  const [selectedSubtask, setSelectedSubtask] = useState<{ subtask: Subtask; task: Task } | null>(null);
  const [subtaskDetailsOpen, setSubtaskDetailsOpen] = useState(false);
  
  // Assessment details
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [assessmentDetailsOpen, setAssessmentDetailsOpen] = useState(false);
  
  // Timetable event details
  const [selectedTimetableEvent, setSelectedTimetableEvent] = useState<FlexibleEvent | null>(null);
  const [timetableEventDetailsOpen, setTimetableEventDetailsOpen] = useState(false);
  
  // Upcoming events
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [eventSelectionMode, setEventSelectionMode] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [fullView, setFullView] = useState(() => localStorage.getItem('calendarFullView') === 'true');
  useEffect(() => { localStorage.setItem('calendarFullView', String(fullView)); }, [fullView]);
  
  useEffect(() => {
    setAssessments(safeParse('assessments').filter((a: Assessment) => !a.deletedAt) as Assessment[]);
    setTimetables((safeParse('timetables') as Timetable[]).filter(t => !t.deletedAt));
  }, []);

  useEffect(() => {
    const reload = () => {
      setTasks(safeParse('tasks') as Task[]);
      setEvents(safeParse('calendarEvents') as CalendarEvent[]);
      setLists(safeParse('lists') as TaskList[]);
      setPartialSlots(loadPartialSlots());
    };
    const reloadEvents = () => setEvents(safeParse('calendarEvents') as CalendarEvent[]);
    const reloadLists = () => { setLists(safeParse('lists') as TaskList[]); setPartialSlots(loadPartialSlots()); };
    window.addEventListener('storage', reload);
    window.addEventListener('calendarEventsUpdated', reloadEvents);
    window.addEventListener('listsUpdated', reloadLists);
    window.addEventListener('partialScheduleUpdated', reloadLists);
    return () => { window.removeEventListener('storage', reload); window.removeEventListener('calendarEventsUpdated', reloadEvents); window.removeEventListener('listsUpdated', reloadLists); window.removeEventListener('partialScheduleUpdated', reloadLists); };
  }, []);

  // Skip the mount run: re-saving loaded data must never touch storage (or sync).
  useEffect(() => {
    if (!tasksMountedRef.current) { tasksMountedRef.current = true; return; }
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (!eventsMountedRef.current) { eventsMountedRef.current = true; return; }
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  }, [events]);

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      order: 0,
    };
    setTasks([
      task,
      ...tasks.map((t) => ({ ...t, order: (t.order ?? 0) + 1 })),
    ]);
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
      deleteStoredEntity('calendarEvents', eventToDelete);
      setEvents(safeParse('calendarEvents') as CalendarEvent[]);
      toast.success('Event moved to recently deleted');
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

  const handleDateSelect = (date: Date | undefined) => setSelectedDate(date);
  const handleAddTaskForDate = () => setAddDialogOpen(true);
  const handleAddEventForDate = () => setAddEventDialogOpen(true);

  const handleShowDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) { setSelectedTask(task); setDetailsDialogOpen(true); }
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) { setSelectedTask(task); setEditDialogOpen(true); }
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditEventDialogOpen(false);
    setSelectedEvent(event);
    setEventDetailsDialogOpen(true);
  };

  const handleEditEvent = () => {
    setEventDetailsDialogOpen(false);
    setEditEventDialogOpen(true);
  };

  const handleDuplicateEvent = () => {
    if (!selectedEvent) return;
    const copy: CalendarEvent = {
      ...selectedEvent,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: `${selectedEvent.title} (copy)`,
      createdAt: new Date().toISOString(),
      deletedAt: undefined,
    };
    const updatedEvents = [...events, copy];
    setEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
    setEventDetailsDialogOpen(false);
    toast.success('Event duplicated');
  };

  const handleUpdateEvent = (updatedEvent: CalendarEvent) => {
    const updatedEvents = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    setEvents(updatedEvents);
    localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
    toast.success('Event updated successfully!');
  };

  const handleSubtaskClick = (subtask: Subtask, task: Task) => {
    setSelectedSubtask({ subtask, task });
    setSubtaskDetailsOpen(true);
  };

  const handleAssessmentClick = (assessment: Assessment) => {
    // If linked to a task, redirect to task details
    if (assessment.linkedTaskId) {
      const task = tasks.find(t => t.id === assessment.linkedTaskId);
      if (task) { setSelectedTask(task); setDetailsDialogOpen(true); return; }
    }
    setSelectedAssessment(assessment);
    setAssessmentDetailsOpen(true);
  };

  const getTasksForDate = (date: Date | undefined) => {
    if (!date) return [];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      try { return isSameDay(parseISO(task.dueDate), date); } catch { return false; }
    });
  };

  const getEventsForDate = (date: Date | undefined) => {
    if (!date) return [];
    return events.filter(event => eventOccursOnDate(event, date));
  };

  const getSubtasksForDate = (date: Date | undefined): { subtask: Subtask; task: Task }[] => {
    if (!date) return [];
    const results: { subtask: Subtask; task: Task }[] = [];
    tasks.forEach(task => {
      (task.subtasks || []).forEach(subtask => {
        if (subtask.dueDate) {
          try { if (isSameDay(parseISO(subtask.dueDate), date)) results.push({ subtask, task }); } catch {}
        } else if (subtask.scheduledTime && task.dueDate) {
          try { if (isSameDay(parseISO(task.dueDate), date)) results.push({ subtask, task }); } catch {}
        }
      });
    });
    return results;
  };

  const getAssessmentsForDate = (date: Date | undefined) => {
    if (!date) return [];
    return assessments.filter(a => {
      if (!a.dueDate) return false;
      try { return isSameDay(parseISO(a.dueDate), date); } catch { return false; }
    });
  };

  const getDatesWithTasks = () => {
    const dates: Date[] = [];
    tasks.forEach(task => {
      if (task.dueDate) { try { dates.push(parseISO(task.dueDate)); } catch {} }
    });
    return dates;
  };

  const getDatesWithEvents = () => {
    const anchor = selectedDate || new Date();
    return getEventDatesForRange(
      events.filter(event => !event.recurring?.enabled),
      new Date(anchor.getTime() - 1000 * 60 * 60 * 24 * 120),
      new Date(anchor.getTime() + 1000 * 60 * 60 * 24 * 120)
    );
  };

  const tasksForSelectedDate = getTasksForDate(selectedDate);
  const eventsForSelectedDate = getEventsForDate(selectedDate);
  const subtasksForSelectedDate = getSubtasksForDate(selectedDate);
  const assessmentsForSelectedDate = getAssessmentsForDate(selectedDate);
  const datesWithTasks = getDatesWithTasks();
  const datesWithEvents = getDatesWithEvents();

  const totalItems = tasksForSelectedDate.length + eventsForSelectedDate.length + subtasksForSelectedDate.length + assessmentsForSelectedDate.length;

  // Upcoming events sorted by date
  const upcomingEvents = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = events
      .filter(e => {
        try {
          const eventDate = parseISO(e.date);
          return isAfter(eventDate, today) || isSameDay(eventDate, today);
        } catch { return false; }
      })
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return (a.time || '').localeCompare(b.time || '');
      });
    if (!eventSearchQuery.trim()) return upcoming;
    const q = eventSearchQuery.toLowerCase();
    return upcoming.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q)
    );
  }, [events, eventSearchQuery]);

  const handleToggleEventSelection = (eventId: string) => {
    setSelectedEventIds(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const handleBulkDeleteEvents = () => {
    const toDelete = events.filter(e => selectedEventIds.has(e.id));
    const deleted = safeParse('deletedEvents');
    localStorage.setItem('deletedEvents', JSON.stringify([...deleted, ...toDelete.map(e => ({ ...e, deletedAt: new Date().toISOString() }))]));
    setEvents(events.filter(e => !selectedEventIds.has(e.id)));
    toast.success(`${toDelete.length} events moved to recently deleted`);
    setSelectedEventIds(new Set());
    setEventSelectionMode(false);
  };

  const handleMoveItems = (moved: { id: string; type: string; data: any; originalMinutes: number }[], targetMinutes: number, date: string) => {
    if (moved.length === 0) return;
    const anchor = Math.min(...moved.map(item => item.originalMinutes));
    const toTime = (minutes: number) => `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
    let nextTasks = [...tasks];
    let nextEvents = [...events];
    let slots = loadPartialSlots();
    moved.forEach(item => {
      const nextMinutes = Math.max(0, Math.min(1430, targetMinutes + item.originalMinutes - anchor));
      const nextTime = toTime(nextMinutes);
      if (item.type === 'event') nextEvents = nextEvents.map(event => event.id === item.data.id ? { ...event, date, time: nextTime } : event);
      if (item.type === 'subtask') nextTasks = nextTasks.map(task => task.id === item.data.task.id ? { ...task, subtasks: (task.subtasks || []).map(subtask => subtask.id === item.data.subtask.id ? { ...subtask, dueDate: date, scheduledTime: nextTime } : subtask) } : task);
      if (item.type === 'task') nextTasks = nextTasks.map(task => task.id === item.data.id ? { ...task, dueDate: `${date}T${nextTime}:00` } : task);
      if (item.type === 'partial') slots = slots.map(slot => slot.id === item.data.slot.id ? { ...slot, date, time: nextTime } : slot);
    });
    setTasks(nextTasks);
    setEvents(nextEvents);
    localStorage.setItem('tasks', JSON.stringify(nextTasks));
    localStorage.setItem('calendarEvents', JSON.stringify(nextEvents));
    savePartialSlots(slots);
    toast.success(`${moved.length} item${moved.length === 1 ? '' : 's'} moved`);
  };

  // Build combined sorted list for the day panel
  type ListItem = 
    | { type: 'task'; item: Task; time: string | null; title: string }
    | { type: 'event'; item: CalendarEvent; time: string | null; title: string }
    | { type: 'subtask'; item: { subtask: Subtask; task: Task }; time: string | null; title: string }
    | { type: 'assessment'; item: Assessment; time: string | null; title: string };

  const combinedItems: ListItem[] = [
    ...tasksForSelectedDate.map(t => ({ type: 'task' as const, item: t, time: null, title: t.name })),
    ...eventsForSelectedDate.map(e => ({ type: 'event' as const, item: e, time: e.time || null, title: e.title })),
    ...subtasksForSelectedDate.map(s => ({ type: 'subtask' as const, item: s, time: s.subtask.scheduledTime || null, title: s.subtask.title })),
    ...assessmentsForSelectedDate.map(a => ({ type: 'assessment' as const, item: a, time: null, title: a.name })),
  ].sort((a, b) => {
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    if (a.time && b.time) return a.time.localeCompare(b.time);
    return a.title.localeCompare(b.title);
  });

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
              <p className="text-muted-foreground mt-1">Plan your tasks by date</p>
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
                toast.error('Invalid events file.');
              }
            }}
            storageKey="calendarEvents"
            label="All Events"
          />
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Timetable:</span>
          <Select value={selectedTimetableId} onValueChange={setSelectedTimetableId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="All timetables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All timetables</SelectItem>
              <SelectItem value="none">None</SelectItem>
              {timetables.map(t => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setPlannerOpen(true)}>Planner <ChevronDown className="ml-2 h-4 w-4" /></Button>
          <Button variant={moveMode ? 'default' : 'outline'} onClick={() => setMoveMode(value => !value)}>
            <Move className="mr-2 h-4 w-4" />{moveMode ? 'Exit move mode' : 'Move mode'}
          </Button>
          <Button variant={fullView ? 'default' : 'outline'} onClick={() => setFullView(v => !v)} aria-pressed={fullView}>
            {fullView ? 'Full view' : 'Visual view'}
          </Button>
          {moveMode && <span className="text-xs text-muted-foreground">Select timed items, then drag one to a 30-minute position.</span>}
        </div>

        <div className="space-y-6">
          <div className={cn("grid items-start gap-6", !fullView && "lg:grid-cols-2")}>
            <section className="min-w-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="pointer-events-auto w-full p-0"
                classNames={{
                  months: 'w-full', month: 'w-full space-y-3',
                  caption: 'flex justify-center relative items-center h-10', caption_label: 'text-lg font-semibold',
                  table: 'w-full border-collapse table-fixed',
                  head_row: 'grid grid-cols-7', head_cell: 'text-muted-foreground text-xs text-center py-2',
                  row: 'grid grid-cols-7 w-full',
                  cell: cn('min-w-0 border', fullView ? 'min-h-28 h-auto' : 'h-16 sm:h-20'),
                  _unused: 'min-w-0 border border-border relative text-center p-0',
                  day: 'w-full h-full rounded-none p-1 sm:p-2 flex flex-col items-start justify-start font-normal hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring',
                  day_selected: 'bg-primary/15 text-foreground ring-2 ring-inset ring-primary',
                  day_today: 'bg-muted text-foreground', day_outside: 'text-muted-foreground opacity-50',
                }}
                modifiers={{ hasEvent: date => events.some(event => !event.recurring?.enabled && eventOccursOnDate(event, date)) }}
                components={{ DayContent: ({ date }) => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const counts = [
                    { label: 'Tasks', count: getTasksForDate(date).length },
                    { label: 'Subtasks', count: getSubtasksForDate(date).length },
                    { label: 'List items', count: lists.filter(list => !list.archivedAt && !list.deletedAt).reduce((sum, list) => sum + (list.items || []).filter(item => !item.deletedAt && item.dateTime?.slice(0, 10) === dateKey).length, 0) },
                    { label: 'Sessions', count: partialSlots.filter(slot => slot.date === dateKey).length },
                    { label: 'Events', count: events.filter(event => !event.recurring?.enabled && eventOccursOnDate(event, date)).length },
                  ];
                  const total = counts.reduce((sum, item) => sum + item.count, 0);
                  if (fullView) {
                    const names = [
                      ...events.filter(event => eventOccursOnDate(event, date)).map(event => ({ key: `e-${event.id}`, title: `${event.time ? formatTimeTo12Hour(event.time) + ' ' : ''}${event.title}`, color: event.color })),
                      ...getTasksForDate(date).map(task => ({ key: `t-${task.id}`, title: task.name, color: task.color })),
                      ...getSubtasksForDate(date).map(({ subtask }) => ({ key: `s-${subtask.id}`, title: subtask.title, color: undefined as string | undefined })),
                      ...lists.filter(list => !list.archivedAt && !list.deletedAt).flatMap(list => (list.items || []).filter(item => !item.deletedAt && item.dateTime?.slice(0, 10) === dateKey).map(item => ({ key: `l-${item.id}`, title: item.text ?? item.title ?? 'List item', color: undefined as string | undefined }))),
                      ...partialSlots.filter(slot => slot.date === dateKey).map(slot => ({ key: `p-${slot.id}`, title: slot.itemTitle || 'Session', color: undefined as string | undefined })),
                    ];
                    return <div className="w-full min-w-0 text-left">
                      <span className={cn('text-sm', counts[4].count > 0 && 'font-bold')}>{format(date, 'd')}</span>
                      <ul className="mt-1 space-y-0.5">
                        {names.map(n => <li key={n.key} className="text-[10px] leading-3 truncate border-l-2 border-primary pl-1" style={n.color ? { borderColor: n.color } : undefined}>{n.title}</li>)}
                      </ul>
                    </div>;
                  }
                  return <div className="w-full min-w-0 text-left" title={counts.map(item => `${item.count} ${item.label.toLowerCase()}`).join(', ')}>
                    <span className={cn('text-sm', counts[4].count > 0 && 'font-bold')}>{format(date, 'd')}</span>
                    {total > 0 && <span className="block text-[10px] leading-3 mt-1 break-words">{total} {total === 1 ? 'item' : 'items'}</span>}
                  </div>;
                } }}
              />
            </section>

            {/* Day Items List */}
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setExportDayOpen(true)} variant="outline" disabled={!selectedDate} title="Export day plan">
                    <Download className="h-4 w-4 mr-1" /> Export Day
                  </Button>
                  <Button size="sm" onClick={handleAddEventForDate} variant="outline" disabled={!selectedDate}>
                    <Plus className="h-4 w-4 mr-1" /> Event
                  </Button>
                  <Button size="sm" onClick={handleAddTaskForDate} className="bg-gradient-primary" disabled={!selectedDate}>
                    <Plus className="h-4 w-4 mr-1" /> Task
                  </Button>
                </div>
              </div>

              {!selectedDate ? (
                <div className="text-center py-8 text-muted-foreground">Select a date to view or add items</div>
              ) : totalItems === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-3">No items on this date</p>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={handleAddEventForDate} variant="outline"><Plus className="h-4 w-4 mr-1" /> Event</Button>
                    <Button size="sm" onClick={handleAddTaskForDate} variant="outline"><Plus className="h-4 w-4 mr-1" /> Task</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {combinedItems.map(({ type, item, time, title }) => {
                    if (type === 'task') {
                      const task = item as Task;
                      return (
                        <div key={`task-${task.id}`}>
                          <Badge variant="outline" className="mb-1 text-xs">Task</Badge>
                          <TaskCard
                            task={task}
                            onStartFocus={() => { toast.success(`Starting focus session for: ${task.name}`); navigate('/'); }}
                            onShowDetails={handleShowDetails}
                            onEdit={handleEdit}
                            onComplete={(taskId) => {
                              const t = tasks.find(x => x.id === taskId);
                              if (t) {
                                const completed = { ...t, completed: true };
                const archived = safeParse('archivedTasks');
                localStorage.setItem('archivedTasks', JSON.stringify([{ ...completed, archivedAt: new Date().toISOString() }, ...archived]));
                                const updated = tasks.filter(x => x.id !== taskId);
                                setTasks(updated);
                                toast.success('Task completed and archived! 🎉');
                              }
                            }}
                            onDelete={(taskId) => {
                              const t = tasks.find(x => x.id === taskId);
                              if (t) {
                                const deleted = safeParse('deletedTasks');
                                localStorage.setItem('deletedTasks', JSON.stringify([...deleted, { ...t, deletedAt: new Date().toISOString() }]));
                                setTasks(tasks.filter(x => x.id !== taskId));
                                toast.success('Task moved to recently deleted');
                              }
                            }}
                            onUpdateTask={handleUpdateTask}
                          />
                        </div>
                      );
                    }
                    if (type === 'event') {
                      const event = item as CalendarEvent;
                      return (
                        <Card
                          key={`event-${event.id}`}
                          className="p-3 cursor-pointer hover:bg-accent transition-colors"
                          style={event.color ? { borderLeft: `4px solid ${event.color}`, backgroundColor: `${event.color}12` } : undefined}
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-xs">Event</Badge>
                            <span className="font-semibold text-sm truncate">{event.title}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex flex-wrap items-center gap-1"><Clock className="h-3 w-3" />{eventTimingLabel(event)}</span>
                            {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                          </div>
                          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive h-6 w-6 p-0 float-right -mt-8"
                            onClick={(e) => { e.stopPropagation(); setEventToDelete(event.id); setDeleteEventDialog(true); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Card>
                      );
                    }
                    if (type === 'subtask') {
                      const { subtask, task } = item as { subtask: Subtask; task: Task };
                      return (
                        <Card key={`subtask-${subtask.id}`} className="p-3 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => handleSubtaskClick(subtask, task)}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs bg-muted">Subtask</Badge>
                            <span className={cn("font-medium text-sm truncate", subtask.completed && "line-through opacity-60")}>{subtask.title}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {subtask.scheduledTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatTimeTo12Hour(subtask.scheduledTime)}</span>}
                            {subtask.estimatedMinutes && <span>{subtask.estimatedMinutes}m</span>}
                            <span className="truncate">↳ {task.name}</span>
                          </div>
                        </Card>
                      );
                    }
                    if (type === 'assessment') {
                      const assessment = item as Assessment;
                      return (
                        <Card key={`assessment-${assessment.id}`} className="p-3 cursor-pointer hover:bg-accent transition-colors"
                          onClick={() => handleAssessmentClick(assessment)}>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/30">📊 Assessment</Badge>
                            <span className={cn("font-medium text-sm truncate", assessment.completed && "line-through opacity-60")}>{assessment.name}</span>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span>{assessment.assessmentType}</span>
                            {assessment.result.totalScore !== null && (
                              <span>{assessment.result.totalScore}/{assessment.result.totalMaxScore}</span>
                            )}
                          </div>
                        </Card>
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Upcoming Events Dropdown */}
          <Collapsible open={upcomingOpen} onOpenChange={setUpcomingOpen}>
            <Card className="p-4">
              <CollapsibleTrigger className="flex items-center justify-between w-full">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Upcoming Events ({upcomingEvents.length})
                </h2>
                {upcomingOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    variant={eventSelectionMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setEventSelectionMode(!eventSelectionMode); setSelectedEventIds(new Set()); }}
                  >
                    {eventSelectionMode ? 'Cancel' : 'Select'}
                  </Button>
                </div>
                {eventSelectionMode && selectedEventIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => {
                      if (selectedEventIds.size === upcomingEvents.length) setSelectedEventIds(new Set());
                      else setSelectedEventIds(new Set(upcomingEvents.map(e => e.id)));
                    }}>
                      {selectedEventIds.size === upcomingEvents.length ? 'Deselect All' : 'Select All'}
                    </Button>
                    <span className="text-sm text-muted-foreground">{selectedEventIds.size} selected</span>
                    <Button variant="destructive" size="sm" onClick={handleBulkDeleteEvents} className="ml-auto gap-1">
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                )}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
                  ) : upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-2">
                      {eventSelectionMode && (
                        <Checkbox
                          checked={selectedEventIds.has(event.id)}
                          onCheckedChange={() => handleToggleEventSelection(event.id)}
                        />
                      )}
                      <Card
                        className="p-3 cursor-pointer hover:bg-accent transition-colors flex-1"
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{event.title}</p>
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              <span>{format(parseISO(event.date), 'MMM d, yyyy')}</span>
                              <span className="flex flex-wrap items-center gap-1"><Clock className="h-3 w-3" />{eventTimingLabel(event)}</span>
                              {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
                            </div>
                          </div>
                          {!eventSelectionMode && (
                            <Button size="sm" variant="ghost" className="text-destructive h-7 w-7 p-0"
                              onClick={(e) => { e.stopPropagation(); setEventToDelete(event.id); setDeleteEventDialog(true); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Unified Day Calendar */}
          {selectedDate && (
            <div className="h-[500px]">
              <UniversalDayCalendar
                date={selectedDate}
                onDateChange={(d) => setSelectedDate(d)}
                tasks={tasks}
                events={events}
                assessments={assessments}
                selectedTimetableId={selectedTimetableId}
                onTaskClick={(task) => handleShowDetails(task.id)}
                onSubtaskClick={handleSubtaskClick}
                onEventClick={handleEventClick}
                onAssessmentClick={handleAssessmentClick}
                onTimetableEventClick={(event) => {
                  setSelectedTimetableEvent(event);
                  setTimetableEventDetailsOpen(true);
                }}
                moveMode={moveMode}
                onMoveItems={handleMoveItems}
              />
            </div>
          )}
        </div>

        <AddEventDialog open={addEventDialogOpen} onClose={() => setAddEventDialogOpen(false)} onAdd={handleAddEvent}
          prefilledDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined} />

        <ExportDayPlanDialog open={exportDayOpen} onClose={() => setExportDayOpen(false)} date={selectedDate} />
        <PlannerRangeDialog open={plannerOpen} onClose={() => setPlannerOpen(false)} />

        <AddTaskDialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} onAdd={handleAddTask}
          prefilledDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined} />

        <TaskDetailsDialog task={selectedTask} open={editDialogOpen} onClose={() => setEditDialogOpen(false)} onSave={handleUpdateTask} />
        <TaskDetailsViewDialog task={selectedTask} open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} onUpdateTask={handleUpdateTask} onEdit={handleEdit} onDelete={id => { deleteStoredEntity('tasks', id); setTasks(safeParse('tasks') as Task[]); }} />
        
        <EventDetailsViewDialog event={selectedEvent} open={eventDetailsDialogOpen}
          onClose={() => { setEventDetailsDialogOpen(false); setSelectedEvent(null); }} onEdit={handleEditEvent} onDuplicate={handleDuplicateEvent} onDelete={() => { if (!selectedEvent) return; deleteStoredEntity('calendarEvents', selectedEvent.id); setEvents(safeParse('calendarEvents') as CalendarEvent[]); }} />

        <EditEventDialog event={selectedEvent} open={editEventDialogOpen}
          onClose={() => setEditEventDialogOpen(false)} onSave={handleUpdateEvent} />

        <SubtaskFullDetailsDialog
          subtask={selectedSubtask?.subtask || null}
          open={subtaskDetailsOpen}
          onClose={() => setSubtaskDetailsOpen(false)}
          parentTaskName={selectedSubtask?.task.name}
          onDelete={() => { if (!selectedSubtask) return; const task = tasks.find(task => task.id === selectedSubtask.task.id); if (task) handleUpdateTask(removeSubtask(task, selectedSubtask.subtask.id)); setSelectedSubtask(null); }}
          onGoToParentTask={() => {
            if (selectedSubtask) {
              setSubtaskDetailsOpen(false);
              setSelectedTask(selectedSubtask.task);
              setDetailsDialogOpen(true);
            }
          }}
          onEdit={() => {
            if (selectedSubtask) {
              setSubtaskDetailsOpen(false);
              setSelectedTask(selectedSubtask.task);
              setEditDialogOpen(true);
            }
          }}
          onComplete={() => {
            if (selectedSubtask && !selectedSubtask.subtask.completed) {
              const updatedSubtasks = (selectedSubtask.task.subtasks || []).map(s =>
                s.id === selectedSubtask.subtask.id ? { ...s, completed: true } : s
              );
              const updatedTask = { ...selectedSubtask.task, subtasks: updatedSubtasks };
              handleUpdateTask(updatedTask);
              setSubtaskDetailsOpen(false);
              toast.success('Subtask completed!');
            }
          }}
          onUncomplete={() => {
            if (selectedSubtask && selectedSubtask.subtask.completed) {
              const updatedSubtasks = (selectedSubtask.task.subtasks || []).map(s =>
                s.id === selectedSubtask.subtask.id ? { ...s, completed: false } : s
              );
              const updatedTask = { ...selectedSubtask.task, subtasks: updatedSubtasks };
              handleUpdateTask(updatedTask);
              setSubtaskDetailsOpen(false);
              toast.success('Subtask marked incomplete');
            }
          }}
        />

        <AssessmentDetailsDialog
          assessment={selectedAssessment}
          open={assessmentDetailsOpen}
          onClose={() => setAssessmentDetailsOpen(false)}
          onSave={(updated) => {
            const allAssessments = safeParse('assessments') as Assessment[];
            const newList = allAssessments.map(a => a.id === updated.id ? updated : a);
            localStorage.setItem('assessments', JSON.stringify(newList));
            setAssessments(newList.filter(a => !a.deletedAt));
            setAssessmentDetailsOpen(false);
          }}
        />

        <AlertDialog open={deleteEventDialog} onOpenChange={setDeleteEventDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Event</AlertDialogTitle>
              <AlertDialogDescription>This event will be moved to recently deleted.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteEvent}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <FlexibleEventDetailsDialog
          event={selectedTimetableEvent}
          open={timetableEventDetailsOpen}
          onOpenChange={setTimetableEventDetailsOpen}
          onSave={() => {}}
          onDelete={() => {}}
          readOnly
          onGoToTimetable={() => navigate('/timetable')}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
