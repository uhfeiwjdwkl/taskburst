import { useState, useEffect, useMemo } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { CalendarEvent } from '@/types/event';
import { Assessment } from '@/types/assessment';
import { Timetable, FlexibleEvent, TimetableCell } from '@/types/timetable';
import { cn } from '@/lib/utils';
import { formatTimeTo12Hour } from '@/lib/dateFormat';
import { eventOccursOnDate, getEventDatesForRange } from '@/lib/eventUtils';
import { format, isSameDay, parseISO, addDays, subDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle2, Play } from 'lucide-react';
import { useAppSettings } from '@/hooks/useAppSettings';

const safeParse = (key: string): any[] => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

interface UniversalDayCalendarProps {
  initialDate?: Date;
  date?: Date;
  onDateChange?: (date: Date) => void;
  tasks?: Task[];
  events?: CalendarEvent[];
  assessments?: Assessment[];
  onTaskClick?: (task: Task) => void;
  onSubtaskClick?: (subtask: Subtask, task: Task) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onAssessmentClick?: (assessment: Assessment) => void;
  onTimetableEventClick?: (event: FlexibleEvent, timetable: Timetable) => void;
  onStartSubtask?: (subtask: Subtask, task: Task) => void;
  showCard?: boolean;
  className?: string;
  selectedTimetableId?: string;
}

interface TimelineItem {
  id: string;
  type: 'task' | 'subtask' | 'event' | 'timetable' | 'assessment' | 'rigid-timetable';
  title: string;
  time?: string;
  endTime?: string;
  duration?: number;
  completed?: boolean;
  color?: string;
  parentTitle?: string;
  data: any;
}

const getFlexibleEventsForTimetable = (timetableId: string): FlexibleEvent[] => {
  const saved = localStorage.getItem('flexibleTimetableEvents');
  if (!saved) return [];
  try {
    const allEvents = JSON.parse(saved) as FlexibleEvent[];
    return Array.isArray(allEvents) ? allEvents.filter(e => e.timetableId === timetableId) : [];
  } catch { return []; }
};

export const UniversalDayCalendar = ({
  initialDate,
  date: controlledDate,
  onDateChange,
  tasks: externalTasks,
  events: externalEvents,
  assessments: externalAssessments,
  onTaskClick,
  onSubtaskClick,
  onEventClick,
  onAssessmentClick,
  onTimetableEventClick,
  onStartSubtask,
  showCard = true,
  className,
  selectedTimetableId,
}: UniversalDayCalendarProps) => {
  const settings = useAppSettings();
  const mirrorColor = Boolean((settings as any).mirrorColorToProgressBox);
  const [internalDate, setInternalDate] = useState(initialDate || new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const currentDate = controlledDate || internalDate;

  const setDate = (d: Date) => {
    setInternalDate(d);
    onDateChange?.(d);
  };

  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [flexibleEvents, setFlexibleEvents] = useState<FlexibleEvent[]>([]);
  const [currentTimePosition, setCurrentTimePosition] = useState(0);

  useEffect(() => {
    if (externalTasks) {
      setTasks(externalTasks);
    } else {
      setTasks(safeParse('tasks') as Task[]);
    }

    if (externalEvents) {
      setEvents(externalEvents);
    } else {
      setEvents(safeParse('calendarEvents') as CalendarEvent[]);
    }

    if (externalAssessments) {
      setAssessments(externalAssessments);
    } else {
      setAssessments(safeParse('assessments') as Assessment[]);
    }

    try {
      const savedTimetables = localStorage.getItem('timetables');
      if (savedTimetables) {
        const allTimetables = JSON.parse(savedTimetables) as Timetable[];
        const arr = Array.isArray(allTimetables) ? allTimetables : [];
        setTimetables(arr);
        const allFlexEvents: FlexibleEvent[] = [];
        arr.filter(t => t.mode === 'flexible').forEach(t => {
          allFlexEvents.push(...getFlexibleEventsForTimetable(t.id));
        });
        setFlexibleEvents(allFlexEvents);
      }
    } catch {}
  }, [externalTasks, externalEvents, externalAssessments]);

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const position = ((hours - 6) * 60 + minutes) / (16 * 60) * 100;
      setCurrentTimePosition(Math.max(0, Math.min(100, position)));
    };
    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const dayOfWeek = currentDate.getDay();
  const timetableDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const todayItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // Tasks & subtasks
    tasks.forEach(task => {
      if (task.dueDate && format(parseISO(task.dueDate), 'yyyy-MM-dd') === dateStr) {
        items.push({
          id: `task-${task.id}`,
          type: 'task',
          title: task.name,
          completed: task.completed,
          data: task,
        });
      }
      task.subtasks?.forEach(subtask => {
        if (subtask.dueDate === dateStr) {
          items.push({
            id: `subtask-${subtask.id}`,
            type: 'subtask',
            title: subtask.title,
            time: subtask.scheduledTime,
            duration: subtask.estimatedMinutes,
            completed: subtask.completed,
            color: mirrorColor ? subtask.color : undefined,
            parentTitle: task.name,
            data: { subtask, task },
          });
        }
      });
    });

    // Calendar events
    events.forEach(event => {
      if (eventOccursOnDate(event, currentDate)) {
        items.push({
          id: `event-${event.id}`,
          type: 'event',
          title: event.title,
          time: event.time,
          duration: event.duration,
          data: event,
        });
      }
    });

    // Assessments (by due date, all-day items)
    assessments.forEach(assessment => {
      if (!assessment.deletedAt && assessment.dueDate) {
        try {
          if (format(parseISO(assessment.dueDate), 'yyyy-MM-dd') === dateStr) {
            items.push({
              id: `assessment-${assessment.id}`,
              type: 'assessment',
              title: assessment.name,
              completed: assessment.completed,
              data: assessment,
            });
          }
        } catch {}
      }
    });

    // Flexible timetable events
    flexibleEvents
      .filter(e => e.dayIndex === timetableDayIndex)
      .filter(e => {
        const sel = selectedTimetableId ?? (typeof window !== 'undefined' ? localStorage.getItem('calendarSelectedTimetableId') : null);
        if (!sel || sel === 'all') return true;
        if (sel === 'none') return false;
        return e.timetableId === sel;
      })
      .filter(e => {
        const tt = timetables.find(t => t.id === e.timetableId);
        if (tt?.type === 'fortnightly' && tt.fortnightStartDate && e.week) {
          const startDate = new Date(tt.fortnightStartDate);
          const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const calculatedWeek = (Math.floor(daysDiff / 7) % 2) === 0 ? 1 : 2;
          return e.week === calculatedWeek;
        }
        return true;
      })
      .forEach(event => {
        const timetable = timetables.find(t => t.id === event.timetableId);
        const [startH, startM] = event.startTime.split(':').map(Number);
        const [endH, endM] = event.endTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        items.push({
          id: `timetable-${event.id}`,
          type: 'timetable',
          title: event.title,
          time: event.startTime,
          duration,
          color: event.color,
          data: { event, timetable },
        });
      });

    // Rigid timetable events
    timetables
      .filter(t => t.mode === 'rigid' && !t.deletedAt)
      .filter(t => {
        const sel = selectedTimetableId ?? (typeof window !== 'undefined' ? localStorage.getItem('calendarSelectedTimetableId') : null);
        if (!sel || sel === 'all') return true;
        if (sel === 'none') return false;
        return t.id === sel;
      })
      .forEach(timetable => {
        const colIndex = timetable.columns.indexOf(
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][timetableDayIndex]
        );
        if (colIndex === -1) return;

        timetable.rows.forEach((row, rowIndex) => {
          const cellKey = `${rowIndex}-${colIndex}`;
          const cell = timetable.cells[cellKey];
          if (!cell || cell.hidden) return;
          const hasContent = cell.fields?.some(f => f && f.trim() !== '');
          if (!hasContent) return;

          const title = cell.fields.filter(f => f && f.trim()).join(' · ');
          items.push({
            id: `rigid-${timetable.id}-${cellKey}`,
            type: 'rigid-timetable',
            title,
            time: row.startTime,
            duration: row.duration,
            color: cell.color,
            parentTitle: timetable.name,
            data: { cell, timetable, row },
          });
        });
      });

    return items;
  }, [tasks, events, assessments, timetables, flexibleEvents, dateStr, currentDate, timetableDayIndex, selectedTimetableId]);

  const allDayItems = todayItems.filter(item => !item.time);
  const timedItems = todayItems.filter(item => item.time).sort((a, b) =>
    (a.time || '').localeCompare(b.time || '')
  );

  // Compute overlap layout: assign each timed item a column and the total columns for its cluster
  const layoutMap = useMemo(() => {
    const map = new Map<string, { col: number; cols: number }>();
    const items = timedItems.map(it => {
      const [h, m] = (it.time || '0:0').split(':').map(Number);
      const start = h * 60 + m;
      const end = start + (it.duration || 30);
      return { it, start, end };
    }).sort((a, b) => a.start - b.start || a.end - b.end);

    let cluster: typeof items = [];
    let clusterEnd = -1;
    const flush = () => {
      const colEnds: number[] = [];
      const assigned: { id: string; col: number }[] = [];
      for (const x of cluster) {
        let placed = false;
        for (let i = 0; i < colEnds.length; i++) {
          if (colEnds[i] <= x.start) { colEnds[i] = x.end; assigned.push({ id: x.it.id, col: i }); placed = true; break; }
        }
        if (!placed) { colEnds.push(x.end); assigned.push({ id: x.it.id, col: colEnds.length - 1 }); }
      }
      const cols = colEnds.length;
      assigned.forEach(a => map.set(a.id, { col: a.col, cols }));
    };
    for (const x of items) {
      if (cluster.length === 0 || x.start < clusterEnd) {
        cluster.push(x);
        clusterEnd = Math.max(clusterEnd, x.end);
      } else {
        flush();
        cluster = [x];
        clusterEnd = x.end;
      }
    }
    if (cluster.length) flush();
    return map;
  }, [timedItems]);

  const currentItems = useMemo(() => {
    const now = new Date();
    if (!isSameDay(now, currentDate)) return [];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return timedItems.filter(item => {
      if (!item.time) return false;
      const [h, m] = item.time.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + (item.duration || 60);
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    });
  }, [timedItems, currentDate]);

  const hours = Array.from({ length: 17 }, (_, i) => i + 6);

  const getTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return ((hours - 6) * 60 + minutes) / (16 * 60) * 100;
  };

  const getHeightForDuration = (minutes: number): number => {
    return (minutes / (16 * 60)) * 100;
  };

  const handleItemClick = (item: TimelineItem) => {
    switch (item.type) {
      case 'task':
        onTaskClick?.(item.data);
        break;
      case 'subtask':
        onSubtaskClick?.(item.data.subtask, item.data.task);
        break;
      case 'event':
        onEventClick?.(item.data);
        break;
      case 'assessment':
        onAssessmentClick?.(item.data);
        break;
      case 'timetable':
        onTimetableEventClick?.(item.data.event, item.data.timetable);
        break;
      case 'rigid-timetable':
        // For rigid timetable, we can still fire timetable event click with a synthetic FlexibleEvent
        break;
    }
  };

  const getItemEmoji = (type: string) => {
    switch (type) {
      case 'task': return '📋 ';
      case 'subtask': return '📝 ';
      case 'assessment': return '📊 ';
      case 'rigid-timetable': return '🕐 ';
      default: return '';
    }
  };

  const getItemBgClass = (item: TimelineItem) => {
    switch (item.type) {
      case 'event': return 'bg-blue-500/20 border-blue-500';
      case 'timetable': return 'bg-purple-500/20 border-purple-500';
      case 'rigid-timetable': return 'bg-indigo-500/20 border-indigo-500';
      case 'assessment': return 'bg-amber-500/20 border-amber-500';
      default: return item.completed ? 'bg-green-500/20 border-green-500' : 'bg-primary/20 border-primary';
    }
  };

  // Compute dates with tasks and events for calendar modifiers
  const datesWithTasks = useMemo(() => {
    const dates: Date[] = [];
    tasks.forEach(task => {
      if (task.dueDate) { try { dates.push(parseISO(task.dueDate)); } catch {} }
    });
    return dates;
  }, [tasks]);

  const datesWithEvents = useMemo(() => {
    return getEventDatesForRange(events, addDays(currentDate, -120), addDays(currentDate, 120));
  }, [events, currentDate]);

  const isToday = isSameDay(currentDate, new Date());

  const content = (
    <div className="flex flex-col h-full">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDate(subDays(currentDate, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">
            {format(currentDate, 'EEE, MMM d')}
          </h3>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(d) => {
                  if (d) { setDate(d); setCalendarOpen(false); }
                }}
                className="pointer-events-auto"
                modifiers={{ hasTask: datesWithTasks, hasEvent: datesWithEvents }}
                modifiersStyles={{
                  hasTask: { textDecoration: 'underline', textDecorationColor: 'hsl(var(--primary))', textDecorationThickness: '2px' },
                  hasEvent: { fontWeight: 'bold' },
                }}
              />
            </PopoverContent>
          </Popover>
          <Badge variant="outline" className="text-xs">
            {todayItems.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDate(addDays(currentDate, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Current Items Highlight */}
      {currentItems.length > 0 && (
        <div className="mb-2 p-2 bg-primary/10 rounded-lg border border-primary/20 flex-shrink-0">
          <div className="text-xs font-medium text-primary mb-1">Now</div>
          {currentItems.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-primary/10 rounded p-1"
              onClick={() => handleItemClick(item)}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || 'hsl(var(--primary))' }} />
              <span className="font-medium truncate">{item.title}</span>
              {item.type === 'subtask' && onStartSubtask && (
                <Button size="sm" variant="ghost" className="ml-auto h-6 px-2" onClick={(e) => {
                  e.stopPropagation();
                  onStartSubtask(item.data.subtask, item.data.task);
                }}>
                  <Play className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* All Day Section */}
      {allDayItems.length > 0 && (
        <div className="mb-2 pb-2 border-b flex-shrink-0">
          <div className="text-xs font-medium text-muted-foreground mb-1">All Day</div>
          <div className="flex flex-wrap gap-1">
            {allDayItems.map(item => (
              <Badge
                key={item.id}
                variant={item.completed ? "secondary" : "outline"}
                className={cn(
                  "text-xs cursor-pointer hover:bg-accent",
                  item.completed && "line-through opacity-60"
                )}
                onClick={() => handleItemClick(item)}
              >
                {getItemEmoji(item.type)}
                {item.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Grid */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="relative" style={{ height: '680px' }}>
          {/* Hour lines */}
          {hours.map((hour, index) => (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-border/50 flex"
              style={{ top: `${(index / 16) * 100}%` }}
            >
              <div className="w-10 text-[10px] text-muted-foreground pr-1 text-right -mt-2 bg-card">
                {hour.toString().padStart(2, '0')}:00
              </div>
            </div>
          ))}

          {/* Current time indicator */}
          {isToday && currentTimePosition > 0 && currentTimePosition < 100 && (
            <div
              className="absolute left-10 right-0 h-0.5 bg-destructive z-20"
              style={{ top: `${currentTimePosition}%` }}
            >
              <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-destructive" />
            </div>
          )}

          {/* Timed Items */}
          <div className="absolute left-12 right-1 top-0 bottom-0">
            {timedItems.map(item => {
              const top = getTimePosition(item.time!);
              const height = getHeightForDuration(item.duration || 30);
              const layout = layoutMap.get(item.id) || { col: 0, cols: 1 };
              const widthPct = 100 / layout.cols;
              const leftPct = layout.col * widthPct;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "absolute border-l-2 rounded-r px-2 py-0.5 cursor-pointer overflow-hidden transition-colors hover:opacity-80",
                    getItemBgClass(item),
                    item.completed && "opacity-60"
                  )}
                  style={{
                    top: `${top}%`,
                    height: `${Math.max(height, 3)}%`,
                    left: `${leftPct}%`,
                    width: `calc(${widthPct}% - 2px)`,
                    backgroundColor: item.color ? `${item.color}30` : undefined,
                    borderColor: item.color || undefined,
                  }}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-1">
                    {item.completed && <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0" />}
                    <span className={cn("text-xs font-medium truncate", item.completed && "line-through")}>
                      {item.title}
                    </span>
                    {item.type === 'subtask' && !item.completed && onStartSubtask && (
                      <Button size="sm" variant="ghost" className="ml-auto h-5 w-5 p-0 flex-shrink-0" onClick={(e) => {
                        e.stopPropagation();
                        onStartSubtask(item.data.subtask, item.data.task);
                      }}>
                        <Play className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {formatTimeTo12Hour(item.time!)}
                    {item.duration && ` • ${item.duration}m`}
                  </div>
                  {item.parentTitle && (
                    <div className="text-[10px] text-muted-foreground truncate">
                      {item.parentTitle}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  if (showCard) {
    return <Card className={cn("p-4 h-full flex flex-col", className)}>{content}</Card>;
  }

  return <div className={cn("h-full flex flex-col", className)}>{content}</div>;
};
