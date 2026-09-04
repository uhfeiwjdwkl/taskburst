import { useMemo, useState } from 'react';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Printer, X } from 'lucide-react';
import { Task } from '@/types/task';
import { CalendarEvent } from '@/types/event';
import { Assessment } from '@/types/assessment';
import { List } from '@/types/list';
import { eventOccursOnDate, getEventTimeSpanForDate } from '@/lib/eventUtils';
import { getPartialSlotsForDate } from '@/lib/partialSchedule';

interface PlannerRangeDialogProps { open: boolean; onClose: () => void }
type PlannerItem = { id: string; type: string; title: string; time?: string; detail?: string };

const read = <T,>(key: string): T[] => {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
  catch { return []; }
};

const itemsForDay = (day: Date): PlannerItem[] => {
  const date = format(day, 'yyyy-MM-dd');
  const tasks = read<Task>('tasks');
  const events = read<CalendarEvent>('calendarEvents');
  const assessments = read<Assessment>('assessments');
  const lists = read<List>('lists');
  const items: PlannerItem[] = [];

  tasks.filter(task => !task.deletedAt).forEach(task => {
    if (task.dueDate?.split('T')[0] === date) {
      const time = task.dueDate.includes('T') ? format(parseISO(task.dueDate), 'HH:mm') : undefined;
      items.push({ id: `task-${task.id}`, type: 'Task', title: task.name, time, detail: task.category });
    }
    (task.subtasks || []).filter(subtask => subtask.dueDate === date).forEach(subtask =>
      items.push({ id: `subtask-${subtask.id}`, type: 'Subtask', title: subtask.title, time: subtask.scheduledTime, detail: task.name })
    );
  });
  events.filter(event => !event.deletedAt && eventOccursOnDate(event, day)).forEach(event => {
    const span = getEventTimeSpanForDate(event, day);
    items.push({ id: `event-${event.id}`, type: 'Event', title: event.title, time: span.time, detail: event.location });
  });
  assessments.filter(item => !item.deletedAt && item.dueDate?.split('T')[0] === date).forEach(item =>
    items.push({ id: `assessment-${item.id}`, type: 'Assessment', title: item.name, detail: item.category })
  );
  lists.filter(list => !list.deletedAt).forEach(list => {
    if (list.dueDateTime?.split('T')[0] === date) items.push({ id: `list-${list.id}`, type: 'List', title: list.title });
    list.items.filter(item => !item.deletedAt && item.dateTime?.split('T')[0] === date).forEach(item => {
      const parsed = parseISO(item.dateTime || date);
      const hasTime = Boolean(item.dateTime?.includes('T'));
      items.push({ id: `list-item-${item.id}`, type: 'List item', title: item.title, time: hasTime ? format(parsed, 'HH:mm') : undefined, detail: list.title });
    });
  });
  getPartialSlotsForDate(date).forEach(slot => items.push({ id: `partial-${slot.id}`, type: 'Session', title: slot.itemTitle || 'Scheduled session', time: slot.time, detail: `${slot.duration} minutes` }));
  return items.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99') || a.title.localeCompare(b.title));
};

export function PlannerRangeDialog({ open, onClose }: PlannerRangeDialogProps) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState(today);
  const days = useMemo(() => {
    try {
      const from = parseISO(start), to = parseISO(end);
      return from <= to ? eachDayOfInterval({ start: from, end: to }) : [];
    } catch { return []; }
  }, [start, end]);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto print:max-w-none print:max-h-none print:overflow-visible print:border-0 print:shadow-none">
        <DialogHeader className="flex flex-row items-center justify-between print:hidden">
          <DialogTitle>Planner</DialogTitle>
          <Button variant="ghost" size="icon" aria-label="Close planner" onClick={onClose}><X className="h-4 w-4" /></Button>
        </DialogHeader>
        <div className="flex flex-wrap items-end gap-3 print:hidden">
          <div><Label htmlFor="planner-start">From</Label><Input id="planner-start" type="date" value={start} onChange={event => setStart(event.target.value)} /></div>
          <div><Label htmlFor="planner-end">To</Label><Input id="planner-end" type="date" min={start} value={end} onChange={event => setEnd(event.target.value)} /></div>
          <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print planner</Button>
        </div>
        <section className="space-y-4" aria-label="Planner date range">
          <h1 className="hidden text-2xl font-bold print:block">TaskBurst Planner · {start} to {end}</h1>
          {days.map(day => {
            const items = itemsForDay(day);
            return <article key={day.toISOString()} className="break-inside-avoid border-t pt-3">
              <h2 className="mb-2 text-lg font-semibold">{format(day, 'EEEE, d MMMM yyyy')}</h2>
              {items.length === 0 ? <p className="text-sm text-muted-foreground">No scheduled items.</p> : (
                <div className="grid gap-2">
                  {items.map(item => <div key={item.id} className="grid min-h-12 grid-cols-[5rem_7rem_1fr] items-start gap-2 border p-2">
                    <span className="font-mono text-sm">{item.time || 'All day'}</span>
                    <Badge variant="outline" className="w-fit">{item.type}</Badge>
                    <div className="min-w-0"><div className="font-medium whitespace-normal break-words">{item.title}</div>{item.detail && <div className="text-sm text-muted-foreground whitespace-normal break-words">{item.detail}</div>}</div>
                  </div>)}
                </div>
              )}
            </article>;
          })}
        </section>
      </DialogContent>
    </Dialog>
  );
}