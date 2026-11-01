import { format, parseISO, isValid, differenceInCalendarDays } from 'date-fns';
import { Task } from '@/types/task';
import { ScheduledItem } from '@/types/subtask';
import { CalendarEvent } from '@/types/event';
import { Timetable, FlexibleEvent } from '@/types/timetable';
import { Assessment } from '@/types/assessment';
import { List } from '@/types/list';
import { eventOccursOnDate, getEventTimeSpanForDate } from '@/lib/eventUtils';
import { clockMinutes } from '@/lib/eventTiming';
import { getPartialSlotsForDate } from '@/lib/partialSchedule';
export type PlanItem = {
  id: string;
  type: 'event' | 'task' | 'subtask' | 'timetable' | 'assessment' | 'list' | 'partial' | 'listItem';
  title: string;
  startMin: number; // minutes from midnight
  endMin: number;
  color: string;
  allDay?: boolean;
  recurring?: boolean;
  duration?: number;
};

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    return p ?? fallback;
  } catch { return fallback; }
};

export const planTime = (min: number, format12: boolean) => {
  const h = Math.floor(min / 60), m = min % 60;
  if (format12) {
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 || 12;
    return `${dh}:${String(m).padStart(2, '0')} ${period}`;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const planDuration = (min: number) => {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

export function collectItemsForDate(date: Date): PlanItem[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  const items: PlanItem[] = [];
  const dow = date.getDay();
  const ttDayIdx = dow === 0 ? 6 : dow - 1;

  const tasks = safeParse<Task[]>('tasks', []);
  const events = safeParse<CalendarEvent[]>('calendarEvents', []);
  const timetables = safeParse<Timetable[]>('timetables', []);
  const flexEvents = safeParse<FlexibleEvent[]>('flexibleTimetableEvents', []);
  const assessments = safeParse<Assessment[]>('assessments', []);
  const lists = safeParse<List[]>('lists', []);

  // Events
  (Array.isArray(events) ? events : []).forEach(ev => {
    try {
      if (!eventOccursOnDate(ev, date)) return;
      const span = getEventTimeSpanForDate(ev, date);
      if (!span.time) {
        items.push({
          id: `event-${ev.id}`,
          type: 'event',
        recurring: !!ev.recurring?.enabled,
          title: ev.title,
          startMin: 0,
          endMin: 0,
          color: ev.color || '#3b82f6',
          allDay: true,
        });
        return;
      }
      const [h, m] = span.time.split(':').map(Number);
      const start = h * 60 + m;
      items.push({
        id: `event-${ev.id}`,
        type: 'event',
        recurring: !!ev.recurring?.enabled,
        title: ev.title,
        startMin: start,
        endMin: start + (span.duration || 60),
        color: ev.color || '#3b82f6',
      });
    } catch { /* ignore */ }
  });

  // Tasks (only if scheduled at a specific time — otherwise skip in timeline)
  (Array.isArray(tasks) ? tasks : []).forEach(t => {
    if (t.deletedAt) return;
    if (t.dueDate?.split('T')[0] === dateStr) {
    // Try to pull a time from the ISO string
    const d = parseISO(t.dueDate);
    if (isValid(d) && (t.dueDate.includes('T') && !t.dueDate.endsWith('T00:00:00.000Z'))) {
      const startMin = d.getHours() * 60 + d.getMinutes();
      const dur = t.estimatedMinutes ?? 0;
      items.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.name,
        startMin,
        endMin: startMin + dur,
        color: t.color || '#8b5cf6',
      });
    } else {
      items.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.name,
        startMin: 0,
        endMin: 0,
        color: t.color || '#8b5cf6',
        allDay: true,
      });
    }
    }
    // Subtasks with scheduled time
    (t.subtasks || []).forEach(s => {
      if (s.dueDate?.split('T')[0] !== dateStr) return;
      if (!s.scheduledTime) {
        items.push({
          id: `subtask-${t.id}-${s.id}`,
          type: 'subtask',
          title: `${s.title} — ${t.name}`,
          startMin: 0,
          endMin: 0,
          color: s.color || '#10b981',
          allDay: true,
        });
        return;
      }
      const [h, m] = s.scheduledTime.split(':').map(Number);
      const start = h * 60 + m;
      const dur = s.estimatedMinutes ?? 0;
      items.push({
        id: `subtask-${t.id}-${s.id}`,
        type: 'subtask',
        title: `${s.title} — ${t.name}`,
        startMin: start,
        endMin: start + dur,
        color: s.color || '#10b981',
      });
    });
  });

  safeParse<ScheduledItem[]>('scheduledItems', []).forEach(slot => {
    if (slot.scheduledDate !== dateStr) return;
    const task = tasks.find(t => t.id === slot.taskId && !t.deletedAt);
    if (!task) return;
    const subtask = slot.subtaskId ? task.subtasks?.find(s => s.id === slot.subtaskId) : undefined;
    if (slot.type === 'subtask' && !subtask) return;
    const start = clockMinutes(slot.scheduledTime);
    const duration = slot.duration ?? subtask?.estimatedMinutes ?? task.estimatedMinutes ?? 0;
    const id = subtask ? `subtask-${task.id}-${subtask.id}` : `task-${task.id}`;
    const direct = items.findIndex(i => i.id === id && i.startMin === start);
    if (direct >= 0) return;
    items.push({ id: `scheduled-${slot.id}`, type: subtask ? 'subtask' : 'task', title: subtask ? `${subtask.title} — ${task.name}` : task.name, startMin: start, endMin: start + duration, color: subtask?.color || task.color || '#8b5cf6' });
  });

  // Only favourite timetables (or all, if none are favourited) to avoid repeated entries
  const liveTimetables = (Array.isArray(timetables) ? timetables : []).filter((t: Timetable) => !t.deletedAt);
  const anyFavourite = liveTimetables.some((t: Timetable) => t.favorite);
  const useTimetable = (t: Timetable) => !anyFavourite || t.favorite;
  // Timetable flexible events for this day
  (Array.isArray(flexEvents) ? flexEvents : []).forEach(ev => {
    const tt = (timetables as Timetable[]).find(t => t.id === ev.timetableId);
    if (!tt || tt.deletedAt || !useTimetable(tt)) return;
    const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][ttDayIdx];
    const flexCol = tt.columns.findIndex(c => c.toLowerCase().startsWith(dayName.slice(0, 3).toLowerCase()));
    if (ev.dayIndex !== flexCol) return;
    if (tt?.type === 'fortnightly' && tt.fortnightStartDate && ev.week) {
      const start = new Date(tt.fortnightStartDate);
      const daysDiff = differenceInCalendarDays(date, start);
      const wk = (Math.floor(daysDiff / 7) % 2) === 0 ? 1 : 2;
      if (ev.week !== wk) return;
    }
    const [sh, sm] = ev.startTime.split(':').map(Number);
    const [eh, em] = ev.endTime.split(':').map(Number);
    items.push({
      id: `tt-${ev.id}`,
      type: 'timetable',
      title: ev.title + (tt ? ` (${tt.name})` : ''),
      startMin: sh * 60 + sm,
      endMin: eh * 60 + em,
      color: ev.color || '#f59e0b',
    });
  });

  // Rigid timetable cells for this day
  (Array.isArray(timetables) ? timetables : [])
    .filter(tt => tt.mode === 'rigid' && !tt.deletedAt && useTimetable(tt))
    .forEach(tt => {
      const dayName = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][ttDayIdx];
      const colIndex = tt.columns.findIndex(c => c.toLowerCase().startsWith(dayName.slice(0, 3).toLowerCase()));
      if (colIndex < 0) return;
      let wk: 1 | 2 = 1;
      if (tt.type === 'fortnightly' && tt.fortnightStartDate) {
        const start = new Date(tt.fortnightStartDate);
        const daysDiff = differenceInCalendarDays(date, start);
        wk = (Math.floor(daysDiff / 7) % 2) === 0 ? 1 : 2;
      }
      tt.rows.forEach((row, rowIndex) => {
        const cell = tt.cells[`${rowIndex}-${colIndex}`];
        if (!cell || cell.hidden || (cell.week && cell.week !== wk)) return;
        const fields = (cell.fields || []).filter(Boolean);
        if (fields.length === 0) return;
        const [h, m] = row.startTime.split(':').map(Number);
        items.push({
          id: `rigid-${tt.id}-${rowIndex}-${colIndex}`,
          type: 'timetable',
          title: `${fields.join(' · ')} (${tt.name})`,
          startMin: h * 60 + m,
          endMin: h * 60 + m + row.duration,
          color: cell.color || '#f59e0b',
        });
      });
    });

  // Assessments due on this date (all-day → put at 09:00 as a marker)
  (Array.isArray(assessments) ? assessments : []).forEach(a => {
    if (!a.dueDate || a.dueDate.split('T')[0] !== dateStr) return;
    if (a.deletedAt) return;
    items.push({
      id: `assessment-${a.id}`,
      type: 'assessment',
      title: `Assessment: ${a.name}`,
      startMin: 0,
      endMin: 0,
      color: '#ef4444',
      allDay: true,
    });
  });

  // Lists: the list itself when due today, plus any items scheduled today
  (Array.isArray(lists) ? lists : []).forEach(l => {
    if (l.deletedAt) return;
    if (l.dueDateTime && l.dueDateTime.split('T')[0] === dateStr) {
      items.push({
        id: `list-${l.id}`,
        type: 'list',
        title: `List: ${l.title}`,
        startMin: 0,
        endMin: 0,
        color: '#0ea5e9',
        allDay: true,
      });
    }
    (l.items || []).forEach(it => {
      if (it.deletedAt || !it.dateTime) return;
      if (it.dateTime.split('T')[0] !== dateStr) return;
      const d = parseISO(it.dateTime);
      const hasTime = it.dateTime.includes('T') && isValid(d) ;
      if (!hasTime) {
        items.push({
          id: `listitem-${l.id}-${it.id}`,
          type: 'listItem',
          title: `${it.title} — ${l.title}`,
          startMin: 0,
          endMin: 0,
          color: '#0ea5e9',
          allDay: true,
        });
        return;
      }
      const start = d.getHours() * 60 + d.getMinutes();
      items.push({
        id: `listitem-${l.id}-${it.id}`,
        type: 'listItem',
        title: `${it.title} — ${l.title}`,
        startMin: start,
        endMin: start + 30,
        color: '#0ea5e9',
      });
    });
  });

  // Partial scheduling slots (task / subtask work sessions)
  getPartialSlotsForDate(dateStr).forEach(slot => {
    const parentTask = (Array.isArray(tasks) ? tasks : []).find(t => t.id === slot.itemId);
    let label = parentTask?.name || slot.itemTitle || 'Scheduled session';
    if (!parentTask) {
      for (const t of (Array.isArray(tasks) ? tasks : [])) {
        const s = t.subtasks?.find(x => x.id === slot.itemId);
        if (s) { label = `${s.title} — ${t.name}`; break; }
      }
    }
    for (const list of lists) {
      const item = list.items?.find(i => i.id === slot.itemId && !i.deletedAt);
      if (item) label = `${item.title} — ${list.title}`;
      else if (list.id === slot.itemId) label = list.title;
    }
    const [h, m] = slot.time.split(':').map(Number);
    const start = h * 60 + m;
    items.push({
      id: `partial-${slot.id}`,
      type: 'partial',
      title: label,
      startMin: start,
      endMin: start + (slot.duration || 30),
      color: parentTask?.color || '#14b8a6',
    });
  });

  const seen = new Set<string>();
  return items.filter(it => {
    const key = `${it.id}|${it.startMin}|${it.endMin}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map(it => ({ ...it, duration: it.endMin - it.startMin })).sort((a,b) => Number(a.allDay) - Number(b.allDay) || a.startMin - b.startMin);
}


export const planItemVisible = (item: PlanItem, timetable: boolean, recurring: boolean) => (timetable || item.type !== 'timetable') && (recurring || !item.recurring);
