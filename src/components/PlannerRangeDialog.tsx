import { useMemo, useRef, useState } from 'react';
import { eachDayOfInterval, format, parseISO, isValid } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Printer, X } from 'lucide-react';
import { collectItemsForDate, planItemVisible, planTime, planDuration } from '@/lib/planItems';

export function PlannerRangeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [start, setStart] = useState(today), [end, setEnd] = useState(today);
  const [timetable, setTimetable] = useState(true), [recurring, setRecurring] = useState(true);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const planRef = useRef<HTMLElement>(null);
  const days = useMemo(() => {
    const from = parseISO(start), to = parseISO(end);
    return isValid(from) && isValid(to) && from <= to ? eachDayOfInterval({ start: from, end: to }) : [];
  }, [start, end]);
  const rows = days.map(day => ({ day, items: collectItemsForDate(day).filter(i => planItemVisible(i, timetable, recurring)) }));
  const toggle = (id: string) => setExcluded(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const print = () => {
    if (!planRef.current) return;
    const frame = document.createElement('iframe');
    frame.title = 'Printable planner'; frame.style.display = 'none'; document.body.append(frame);
    const doc = frame.contentDocument, win = frame.contentWindow;
    if (!doc || !win) { frame.remove(); return; }
    const content = planRef.current.cloneNode(true) as HTMLElement;
    content.querySelectorAll('[data-excluded="true"], [data-print-hide]').forEach(node => node.remove());
    doc.open(); doc.write('<!doctype html><html><head><title>TaskBurst Planner</title><style>@page{size:A4;margin:12mm}body{font:13px Arial,sans-serif;color:#111}h1{font-size:20px}h2{font-size:16px}article{margin-bottom:18px}.planner-row{display:grid;grid-template-columns:80px 100px 1fr;gap:12px;border:1px solid #bbb;padding:8px;margin:6px 0;break-inside:avoid}.planner-row span{display:block;overflow-wrap:anywhere}section,article{break-inside:auto}</style></head><body></body></html>'); doc.close(); doc.body.append(content);
    win.onafterprint = () => frame.remove();
    win.focus(); win.print();
  };
  return <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}><DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
    <DialogHeader className="flex flex-row items-center justify-between"><DialogTitle>Planner</DialogTitle><Button variant="ghost" size="icon" aria-label="Close planner" onClick={onClose}><X className="h-4 w-4" /></Button></DialogHeader>
    <div className="flex flex-wrap items-end gap-3"><div><Label htmlFor="planner-start">From</Label><Input id="planner-start" type="date" value={start} onChange={e => setStart(e.target.value)} /></div><div><Label htmlFor="planner-end">To</Label><Input id="planner-end" type="date" min={start} value={end} onChange={e => setEnd(e.target.value)} /></div><Button onClick={print}><Printer className="mr-2 h-4 w-4" />Print planner</Button></div>
    <div className="flex flex-wrap gap-5"><Label className="flex items-center gap-2">Timetables<Switch checked={timetable} onCheckedChange={setTimetable} aria-label="Planner timetables" /></Label><Label className="flex items-center gap-2">Recurring events<Switch checked={recurring} onCheckedChange={setRecurring} aria-label="Planner recurring events" /></Label><Button variant="ghost" size="sm" onClick={() => setExcluded(new Set())}>All</Button><Button variant="ghost" size="sm" onClick={() => setExcluded(new Set(rows.flatMap(r => r.items.map(i => `${format(r.day,'yyyy-MM-dd')}:${i.id}`))))}>None</Button></div>
    <section ref={planRef} className="space-y-4" aria-label="Planner date range"><h1 className="text-xl font-bold">TaskBurst Planner · {start} to {end}</h1>{rows.map(({day,items}) => <article key={day.toISOString()} className="border-t pt-3"><h2 className="mb-2 text-lg font-semibold">{format(day,'EEEE, d MMMM yyyy')}</h2>{items.length === 0 ? <p>No scheduled items.</p> : items.map(item => { const key = `${format(day,'yyyy-MM-dd')}:${item.id}`; return <div key={key} data-excluded={excluded.has(key)} className={`planner-row grid grid-cols-[5rem_7rem_1fr] gap-2 border p-2 ${excluded.has(key) ? 'opacity-40' : ''}`}><div className="font-mono text-sm"><span className="block">{item.allDay ? 'All day' : planTime(item.startMin,false)}</span>{!item.allDay && <span className="block text-muted-foreground">{planTime(item.endMin,false)}</span>}</div><div className="text-sm"><span className="block capitalize">{item.type === 'partial' ? 'Session' : item.type === 'listItem' ? 'List item' : item.type}</span><span className="block text-muted-foreground">{item.allDay ? 'All day' : planDuration(item.endMin-item.startMin)}</span></div><div className="flex min-w-0 items-start gap-2"><Checkbox data-print-hide checked={!excluded.has(key)} onCheckedChange={() => toggle(key)} aria-label={`Include ${item.title}`} /><span className="min-w-0 break-words font-medium">{item.title}</span></div></div>; })}</article>)}</section>
  </DialogContent></Dialog>;
}
