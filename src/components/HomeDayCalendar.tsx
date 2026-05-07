import { useState, useEffect, useMemo, useRef } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { CalendarEvent } from '@/types/event';
import { Timetable, FlexibleEvent } from '@/types/timetable';
import { cn } from '@/lib/utils';
import { formatTimeTo12Hour } from '@/lib/dateFormat';
import { format, isSameDay, parseISO } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, CheckCircle2, Play, Calendar, ChevronLeft, ChevronRight, Hand, ZoomIn, MousePointer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useAppSettings } from '@/hooks/useAppSettings';

interface HomeDayCalendarProps {
  date?: Date;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onSubtaskClick?: (subtask: Subtask, task: Task) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onStartSubtask?: (subtask: Subtask, task: Task) => void;
}

interface TimelineItem {
  id: string;
  type: 'task' | 'subtask' | 'event' | 'timetable';
  title: string;
  time?: string;
  endTime?: string;
  duration?: number;
  completed?: boolean;
  color?: string;
  parentTitle?: string;
  data: any;
}

// Get flexible events from localStorage
const getFlexibleEventsForTimetable = (timetableId: string): FlexibleEvent[] => {
  const saved = localStorage.getItem('flexibleTimetableEvents');
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return (parsed as FlexibleEvent[]).filter(e => e.timetableId === timetableId);
  } catch { return []; }
};

export const HomeDayCalendar = ({
  date = new Date(),
  tasks,
  onTaskClick,
  onSubtaskClick,
  onEventClick,
  onStartSubtask,
}: HomeDayCalendarProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [flexibleEvents, setFlexibleEvents] = useState<FlexibleEvent[]>([]);
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  const [selTtId, setSelTtId] = useState<string>(() => (typeof window !== 'undefined' ? (localStorage.getItem('calendarSelectedTimetableId') || 'all') : 'all'));
  const settings = useAppSettings();
  const mirrorColor = Boolean((settings as any).mirrorColorToProgressBox);
  const [displayDate, setDisplayDate] = useState<Date>(date);
  const [interactionMode, setInteractionMode] = useState<'normal' | 'pan' | 'zoom'>('normal');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hZoom, setHZoom] = useState(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<{ y: number; scrollTop: number } | null>(null);

  useEffect(() => {
    const handler = () => setSelTtId(localStorage.getItem('calendarSelectedTimetableId') || 'all');
    window.addEventListener('calendarSelectedTimetableIdChange', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('calendarSelectedTimetableIdChange', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const dateStr = format(displayDate, 'yyyy-MM-dd');
  const dayOfWeek = displayDate.getDay();
  const timetableDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to Mon=0

  // Load events and timetables
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendarEvents');
    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
    
    const savedTimetables = localStorage.getItem('timetables');
    if (savedTimetables) {
      let parsed: unknown;
      try { parsed = JSON.parse(savedTimetables); } catch { parsed = []; }
      const allTimetables = (Array.isArray(parsed) ? parsed : []) as Timetable[];
      setTimetables(allTimetables);
      
      // Load flexible events for all flexible timetables
      const allFlexEvents: FlexibleEvent[] = [];
      allTimetables
        .filter(t => t.mode === 'flexible')
        .forEach(t => {
          allFlexEvents.push(...getFlexibleEventsForTimetable(t.id));
        });
      setFlexibleEvents(allFlexEvents);
    }
  }, []);

  // Update current time position every minute
  useEffect(() => {
    const updatePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      // Position as percentage of the day (6am to 10pm = 16 hours)
      const position = ((hours - 6) * 60 + minutes) / (16 * 60) * 100;
      setCurrentTimePosition(Math.max(0, Math.min(100, position)));
    };
    
    updatePosition();
    const interval = setInterval(updatePosition, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get items for today
  const todayItems = useMemo(() => {
    const items: TimelineItem[] = [];
    const selTt = selTtId;
    const includeTimetable = (ttId: string) => {
      if (!selTt || selTt === 'all') return true;
      if (selTt === 'none') return false;
      return ttId === selTt;
    };

    // Tasks due today
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

      // Subtasks scheduled for today
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

    // Events for today
    events.forEach(event => {
      try {
        const eventDate = parseISO(event.date);
        if (isSameDay(eventDate, displayDate)) {
          items.push({
            id: `event-${event.id}`,
            type: 'event',
            title: event.title,
            time: event.time,
            duration: event.duration,
            data: event,
          });
        }
      } catch {}
    });

    // Flexible timetable events for today
    flexibleEvents
      .filter(e => e.dayIndex === timetableDayIndex && includeTimetable(e.timetableId))
      .forEach(event => {
        const timetable = timetables.find(t => t.id === event.timetableId);
        // Calculate duration from startTime and endTime
        const [startH, startM] = event.startTime.split(':').map(Number);
        const [endH, endM] = event.endTime.split(':').map(Number);
        const duration = (endH * 60 + endM) - (startH * 60 + startM);
        
        items.push({
          id: `timetable-${event.id}`,
          type: 'timetable',
          title: event.title,
          time: event.startTime,
          duration: duration,
          color: event.color,
          data: { event, timetable },
        });
      });

    return items;
  }, [tasks, events, timetables, flexibleEvents, dateStr, displayDate, timetableDayIndex, selTtId, mirrorColor]);

  // Separate all-day and timed items
  const allDayItems = todayItems.filter(item => !item.time);
  const timedItems = todayItems.filter(item => item.time).sort((a, b) => 
    (a.time || '').localeCompare(b.time || '')
  );

  // Overlap layout: assign each timed item a column index and total cluster columns
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
      } else { flush(); cluster = [x]; clusterEnd = x.end; }
    }
    if (cluster.length) flush();
    return map;
  }, [timedItems]);

  // Get current items (happening now)
  const currentItems = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;

    return timedItems.filter(item => {
      if (!item.time) return false;
      const [h, m] = item.time.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + (item.duration || 60);
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    });
  }, [timedItems]);

  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6am to 10pm

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
    }
  };

  // Auto-center current time on mount/date change
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const total = el.scrollHeight;
    const target = (currentTimePosition / 100) * total - el.clientHeight / 2;
    el.scrollTop = Math.max(0, target);
  }, [displayDate]);

  // Pan/Zoom handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    if (interactionMode !== 'pan' || !scrollRef.current) return;
    panRef.current = { y: e.clientY, scrollTop: scrollRef.current.scrollTop };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (interactionMode !== 'pan' || !panRef.current || !scrollRef.current) return;
    const dy = e.clientY - panRef.current.y;
    scrollRef.current.scrollTop = panRef.current.scrollTop - dy;
  };
  const handlePointerUp = () => { panRef.current = null; };
  const handleWheel = (e: React.WheelEvent) => {
    if (interactionMode !== 'zoom') return;
    e.preventDefault();
    if (e.shiftKey) {
      setHZoom(z => Math.min(3, Math.max(0.5, z - e.deltaY * 0.001)));
    } else {
      setZoomLevel(z => Math.min(4, Math.max(0.5, z - e.deltaY * 0.001)));
    }
  };

  return (
    <Card className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(displayDate, 'EEE, MMM d')}
          </h3>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setDisplayDate(d => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" size="sm" value={interactionMode} onValueChange={(v) => v && setInteractionMode(v as any)}>
            <ToggleGroupItem value="normal" aria-label="Normal" className="h-7 px-2"><MousePointer className="h-3 w-3" /></ToggleGroupItem>
            <ToggleGroupItem value="pan" aria-label="Pan" className="h-7 px-2"><Hand className="h-3 w-3" /></ToggleGroupItem>
            <ToggleGroupItem value="zoom" aria-label="Zoom" className="h-7 px-2"><ZoomIn className="h-3 w-3" /></ToggleGroupItem>
          </ToggleGroup>
          <Badge variant="outline" className="text-xs">{todayItems.length}</Badge>
        </div>
      </div>

      {/* Current Items Highlight */}
      {currentItems.length > 0 && (
        <div className="mb-3 p-2 bg-primary/10 rounded-lg border border-primary/20">
          <div className="text-xs font-medium text-primary mb-1">Happening Now</div>
          <div className="space-y-1">
            {currentItems.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-2 text-sm cursor-pointer hover:bg-primary/10 rounded p-1"
                onClick={() => handleItemClick(item)}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color || 'hsl(var(--primary))' }}
                />
                <span className="font-medium truncate">{item.title}</span>
                {item.type === 'subtask' && onStartSubtask && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-6 px-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onStartSubtask(item.data.subtask, item.data.task);
                    }}
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Day Section */}
      {allDayItems.length > 0 && (
        <div className="mb-3 pb-2 border-b">
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
                {item.type === 'task' && '📋 '}
                {item.type === 'subtask' && '📝 '}
                {item.title}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Grid */}
      <div
        ref={scrollRef}
        className={cn("flex-1 -mx-2 px-2 overflow-y-auto", interactionMode === 'pan' && 'cursor-grab active:cursor-grabbing select-none')}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        style={{ touchAction: interactionMode === 'pan' ? 'none' : 'auto' }}
      >
        <div className="relative" style={{ height: `${400 * zoomLevel}px`, width: `${100 * hZoom}%` }}>
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
          {currentTimePosition > 0 && currentTimePosition < 100 && (
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

              const bgColor = item.type === 'event' 
                ? 'bg-blue-500/20 border-blue-500'
                : item.type === 'timetable'
                ? 'bg-purple-500/20 border-purple-500'
                : item.completed 
                ? 'bg-green-500/20 border-green-500'
                : 'bg-primary/20 border-primary';

              return (
                <div
                  key={item.id}
                  className={cn(
                    "absolute border-l-2 rounded-r px-2 py-0.5 cursor-pointer overflow-hidden transition-colors hover:opacity-80",
                    bgColor,
                    item.completed && "opacity-60"
                  )}
                  style={{ 
                    top: `${top}%`, 
                    height: `${Math.max(height, 2.5)}%`,
                    left: `${leftPct}%`,
                    width: `calc(${widthPct}% - 2px)`,
                    backgroundColor: item.color ? `${item.color}30` : undefined,
                    borderColor: item.color || undefined,
                  }}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="flex items-center gap-1">
                    {item.completed && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                    <span className={cn(
                      "text-xs font-medium truncate",
                      item.completed && "line-through"
                    )}>
                      {item.title}
                    </span>
                    {item.type === 'subtask' && !item.completed && onStartSubtask && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-auto h-5 w-5 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStartSubtask(item.data.subtask, item.data.task);
                        }}
                      >
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
      </div>
    </Card>
  );
};
