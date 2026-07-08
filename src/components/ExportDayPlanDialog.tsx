import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Task } from '@/types/task';
import { CalendarEvent } from '@/types/event';
import { Timetable, FlexibleEvent } from '@/types/timetable';
import { Assessment } from '@/types/assessment';
import { eventOccursOnDate, getEventTimeSpanForDate } from '@/lib/eventUtils';

interface ExportDayPlanDialogProps {
  open: boolean;
  onClose: () => void;
  date?: Date;
}

type PlanItem = {
  id: string;
  type: 'event' | 'task' | 'subtask' | 'timetable' | 'assessment';
  title: string;
  startMin: number; // minutes from midnight
  endMin: number;
  color: string;
};

const safeParse = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    return p ?? fallback;
  } catch { return fallback; }
};

const fmt = (min: number, format12: boolean) => {
  const h = Math.floor(min / 60), m = min % 60;
  if (format12) {
    const period = h >= 12 ? 'PM' : 'AM';
    const dh = h % 12 || 12;
    return `${dh}:${String(m).padStart(2, '0')} ${period}`;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const durLabel = (min: number) => {
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60), m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

function collectItemsForDate(date: Date): PlanItem[] {
  const dateStr = format(date, 'yyyy-MM-dd');
  const items: PlanItem[] = [];
  const dow = date.getDay();
  const ttDayIdx = dow === 0 ? 6 : dow - 1;

  const tasks = safeParse<Task[]>('tasks', []);
  const events = safeParse<CalendarEvent[]>('calendarEvents', []);
  const timetables = safeParse<Timetable[]>('timetables', []);
  const flexEvents = safeParse<FlexibleEvent[]>('flexibleTimetableEvents', []);
  const assessments = safeParse<Assessment[]>('assessments', []);

  // Events
  (Array.isArray(events) ? events : []).forEach(ev => {
    try {
      if (!eventOccursOnDate(ev, date)) return;
      const span = getEventTimeSpanForDate(ev, date);
      if (!span.time) return; // skip all-day for timeline
      const [h, m] = span.time.split(':').map(Number);
      const start = h * 60 + m;
      items.push({
        id: `event-${ev.id}`,
        type: 'event',
        title: ev.title,
        startMin: start,
        endMin: start + (span.duration || 60),
        color: '#3b82f6',
      });
    } catch { /* ignore */ }
  });

  // Tasks (only if scheduled at a specific time — otherwise skip in timeline)
  (Array.isArray(tasks) ? tasks : []).forEach(t => {
    if (t.deletedAt) return;
    if (!t.dueDate) return;
    if (t.dueDate.split('T')[0] !== dateStr) return;
    // Try to pull a time from the ISO string
    const d = parseISO(t.dueDate);
    if (isValid(d) && (t.dueDate.includes('T') && !t.dueDate.endsWith('T00:00:00.000Z'))) {
      const startMin = d.getHours() * 60 + d.getMinutes();
      const dur = t.estimatedMinutes || 30;
      items.push({
        id: `task-${t.id}`,
        type: 'task',
        title: t.name,
        startMin,
        endMin: startMin + dur,
        color: '#8b5cf6',
      });
    }
    // Subtasks with scheduled time
    (t.subtasks || []).forEach(s => {
      if (s.dueDate !== dateStr) return;
      if (!s.scheduledTime) return;
      const [h, m] = s.scheduledTime.split(':').map(Number);
      const start = h * 60 + m;
      const dur = s.estimatedMinutes || 30;
      items.push({
        id: `subtask-${s.id}`,
        type: 'subtask',
        title: `${s.title} — ${t.name}`,
        startMin: start,
        endMin: start + dur,
        color: s.color || '#10b981',
      });
    });
  });

  // Timetable flexible events for this day
  (Array.isArray(flexEvents) ? flexEvents : []).forEach(ev => {
    if (ev.dayIndex !== ttDayIdx) return;
    const tt = (timetables as Timetable[]).find(t => t.id === ev.timetableId);
    if (tt?.type === 'fortnightly' && tt.fortnightStartDate && ev.week) {
      const start = new Date(tt.fortnightStartDate);
      const daysDiff = Math.floor((date.getTime() - start.getTime()) / 86400000);
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

  // Assessments due on this date (all-day → put at 09:00 as a marker)
  (Array.isArray(assessments) ? assessments : []).forEach(a => {
    if (!a.dueDate || a.dueDate.split('T')[0] !== dateStr) return;
    if (a.deletedAt) return;
    items.push({
      id: `assessment-${a.id}`,
      type: 'assessment',
      title: `Assessment: ${a.name}`,
      startMin: 9 * 60,
      endMin: 9 * 60 + 30,
      color: '#ef4444',
    });
  });

  return items;
}

// Pack overlapping items into columns (leftmost fit).
function packColumns(items: PlanItem[]) {
  const sorted = [...items].sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin);
  type Placed = PlanItem & { col: number; cols: number };
  const clusters: Placed[][] = [];
  let cluster: Placed[] = [];
  let clusterEnd = -1;
  const flush = () => {
    if (cluster.length === 0) return;
    const colEnds: number[] = [];
    for (const item of cluster) {
      let placed = false;
      for (let i = 0; i < colEnds.length; i++) {
        if (colEnds[i] <= item.startMin) {
          colEnds[i] = item.endMin;
          item.col = i;
          placed = true;
          break;
        }
      }
      if (!placed) {
        colEnds.push(item.endMin);
        item.col = colEnds.length - 1;
      }
    }
    const cols = colEnds.length;
    cluster.forEach(x => (x.cols = cols));
    clusters.push(cluster);
    cluster = [];
    clusterEnd = -1;
  };
  for (const it of sorted) {
    const placed = { ...it, col: 0, cols: 1 } as Placed;
    if (cluster.length === 0 || placed.startMin < clusterEnd) {
      cluster.push(placed);
      clusterEnd = Math.max(clusterEnd, placed.endMin);
    } else {
      flush();
      cluster.push(placed);
      clusterEnd = placed.endMin;
    }
  }
  flush();
  return clusters;
}

const TYPE_LABEL: Record<PlanItem['type'], string> = {
  event: 'Event',
  task: 'Task',
  subtask: 'Subtask',
  timetable: 'Timetable',
  assessment: 'Assessment',
};

export function ExportDayPlanDialog({ open, onClose, date }: ExportDayPlanDialogProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(date || new Date(), 'yyyy-MM-dd')
  );
  const [format12, setFormat12] = useState(false);
  const [colour, setColour] = useState(true);
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'png' | 'html'>('pdf');
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const previewRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedDate(format(date || new Date(), 'yyyy-MM-dd'));
      setExcluded(new Set());
      try {
        const s = JSON.parse(localStorage.getItem('appSettings') || '{}');
        setFormat12(s.timeFormat === '12h');
      } catch { /* ignore */ }
    }
  }, [open, date]);

  const parsedDate = useMemo(() => {
    const d = parseISO(selectedDate);
    return isValid(d) ? d : new Date();
  }, [selectedDate]);

  const allItems = useMemo(() => collectItemsForDate(parsedDate), [parsedDate]);
  const selectedItems = useMemo(
    () => allItems.filter(i => !excluded.has(i.id)),
    [allItems, excluded]
  );

  const clusters = useMemo(() => packColumns(selectedItems), [selectedItems]);

  const toggle = (id: string) =>
    setExcluded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const setAll = (on: boolean) => {
    if (on) setExcluded(new Set());
    else setExcluded(new Set(allItems.map(i => i.id)));
  };

  async function handleExport() {
    if (selectedItems.length === 0) {
      toast.error('Select at least one item.');
      return;
    }
    const filename = `day-plan-${selectedDate}`;
    setBusy(true);
    try {
      if (outputFormat === 'html') {
        const html = renderStandaloneHtml(parsedDate, clusters, colour, format12);
        const blob = new Blob([html], { type: 'text/html' });
        downloadBlob(blob, `${filename}.html`);
      } else {
        if (!previewRef.current) throw new Error('Preview missing');
        // Force high-res render
        const node = previewRef.current;
        const dataUrl = await toPng(node, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true });
        if (outputFormat === 'png') {
          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = `${filename}.png`;
          a.click();
        } else {
          // PDF: A4 portrait, fit width
          const img = new Image();
          img.src = dataUrl;
          await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('img load')); });
          const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
          const pageW = pdf.internal.pageSize.getWidth();
          const pageH = pdf.internal.pageSize.getHeight();
          const margin = 10;
          const availW = pageW - margin * 2;
          const imgH = (img.height * availW) / img.width;
          if (imgH <= pageH - margin * 2) {
            pdf.addImage(dataUrl, 'PNG', margin, margin, availW, imgH);
          } else {
            // Paginate: slice canvas into page-sized chunks
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const pageHpx = (img.width * (pageH - margin * 2)) / availW;
            let y = 0;
            let first = true;
            while (y < img.height) {
              const sliceH = Math.min(pageHpx, img.height - y);
              const sliceCanvas = document.createElement('canvas');
              sliceCanvas.width = img.width;
              sliceCanvas.height = sliceH;
              const sctx = sliceCanvas.getContext('2d')!;
              sctx.fillStyle = '#ffffff';
              sctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
              sctx.drawImage(canvas, 0, -y);
              const url = sliceCanvas.toDataURL('image/png');
              if (!first) pdf.addPage();
              pdf.addImage(url, 'PNG', margin, margin, availW, (sliceH * availW) / img.width);
              first = false;
              y += sliceH;
            }
          }
          pdf.save(`${filename}.pdf`);
        }
      }
      toast.success('Day plan exported.');
    } catch (e) {
      console.error(e);
      toast.error('Export failed. See console.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Export Day Plan</DialogTitle>
          <DialogDescription>
            Generate a timeline for the selected day. Each item is a chronological box; concurrent items sit side by side.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <Label>Date</Label>
              <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            </div>
            <div>
              <Label>Format</Label>
              <RadioGroup value={outputFormat} onValueChange={(v) => setOutputFormat(v as any)} className="flex gap-4 mt-1">
                <div className="flex items-center gap-2"><RadioGroupItem value="pdf" id="fmt-pdf" /><Label htmlFor="fmt-pdf" className="font-normal">PDF</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="png" id="fmt-png" /><Label htmlFor="fmt-png" className="font-normal">PNG</Label></div>
                <div className="flex items-center gap-2"><RadioGroupItem value="html" id="fmt-html" /><Label htmlFor="fmt-html" className="font-normal">HTML</Label></div>
              </RadioGroup>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="colour-toggle" className="font-normal">Colour output (off = B&W, outline only)</Label>
              <Switch id="colour-toggle" checked={colour} onCheckedChange={setColour} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Items to include ({selectedItems.length}/{allItems.length})</Label>
                <div className="flex gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAll(true)}>All</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setAll(false)}>None</Button>
                </div>
              </div>
              <ScrollArea className="h-56 border rounded p-2">
                {allItems.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2">Nothing scheduled on this day.</div>
                ) : (
                  <ul className="space-y-1">
                    {allItems.map(it => (
                      <li key={it.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={!excluded.has(it.id)}
                          onCheckedChange={() => toggle(it.id)}
                          id={`chk-${it.id}`}
                        />
                        <label htmlFor={`chk-${it.id}`} className="flex-1 cursor-pointer flex items-center gap-2 min-w-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted flex-shrink-0">{TYPE_LABEL[it.type]}</span>
                          <span className="truncate">{it.title}</span>
                          <span className="text-xs text-muted-foreground flex-shrink-0">{fmt(it.startMin, format12)}–{fmt(it.endMin, format12)}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Preview</Label>
            <div className="border rounded p-2 bg-white overflow-auto max-h-[60vh]">
              <TimelinePreview ref={previewRef} date={parsedDate} clusters={clusters} colour={colour} format12={format12} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={handleExport} disabled={busy || selectedItems.length === 0}>
            {busy ? 'Generating…' : `Generate ${outputFormat.toUpperCase()}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --------- Timeline preview (also used for PNG/PDF capture) ---------

interface TimelinePreviewProps {
  date: Date;
  clusters: (PlanItem & { col: number; cols: number })[][];
  colour: boolean;
  format12: boolean;
}

import { forwardRef } from 'react';

const TimelinePreview = forwardRef<HTMLDivElement, TimelinePreviewProps>(function TimelinePreview(
  { date, clusters, colour, format12 }, ref
) {
  const boxHeight = 88; // px per item (content-driven fixed for legibility)
  const gap = 8;

  return (
    <div ref={ref} style={{ padding: 16, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#000', background: '#fff', width: 640 }}>
      <div style={{ borderBottom: '2px solid #000', paddingBottom: 8, marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Day Plan</div>
        <div style={{ fontSize: 14 }}>{format(date, 'EEEE, d MMMM yyyy')}</div>
      </div>
      {clusters.length === 0 ? (
        <div style={{ fontSize: 14, color: '#666' }}>No items to display.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {clusters.map((cluster, ci) => {
            const cols = cluster[0]?.cols || 1;
            // group height = maxItemsInAnyColumn * (boxHeight + gap)
            const perCol: number[] = Array.from({ length: cols }, () => 0);
            cluster.forEach(it => { perCol[it.col] += 1; });
            const maxCount = Math.max(...perCol, 1);
            const groupHeight = maxCount * boxHeight + (maxCount - 1) * gap;
            // For each column, stretch each item so column fills groupHeight.
            const columnItems: (PlanItem & { col: number; cols: number })[][] = Array.from({ length: cols }, () => []);
            cluster.forEach(it => columnItems[it.col].push(it));
            columnItems.forEach(col => col.sort((a, b) => a.startMin - b.startMin));
            return (
              <div key={ci} style={{ display: 'flex', gap: 8, height: groupHeight }}>
                {columnItems.map((colItems, coli) => {
                  const stretchH = colItems.length ? (groupHeight - (colItems.length - 1) * gap) / colItems.length : groupHeight;
                  return (
                    <div key={coli} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap }}>
                      {colItems.map(it => (
                        <div
                          key={it.id}
                          style={{
                            border: `1.5px solid ${colour ? it.color : '#000'}`,
                            background: colour ? `${it.color}18` : '#fff',
                            borderRadius: 6,
                            padding: '8px 10px',
                            height: stretchH,
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            fontSize: 12,
                            overflow: 'hidden',
                          }}
                        >
                          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.7 }}>
                            {TYPE_LABEL[it.type]}
                          </div>
                          <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.25, wordBreak: 'break-word' }}>
                            {it.title}
                          </div>
                          <div style={{ fontSize: 11, opacity: 0.85 }}>
                            {fmt(it.startMin, format12)} – {fmt(it.endMin, format12)} · {durLabel(it.endMin - it.startMin)}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

function renderStandaloneHtml(date: Date, clusters: (PlanItem & { col: number; cols: number })[][], colour: boolean, format12: boolean): string {
  const style = `
    body { font-family: system-ui, sans-serif; margin: 24px; color: #000; background: #fff; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 14px; font-weight: 400; margin: 0 0 16px; }
    .cluster { display: flex; gap: 8px; margin-bottom: 16px; }
    .col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
    .box { border: 1.5px solid #000; border-radius: 6px; padding: 8px 10px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; font-size: 12px; overflow: hidden; }
    .type { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.7; }
    .title { font-weight: 600; font-size: 13px; word-break: break-word; }
    .time { font-size: 11px; opacity: 0.85; }
  `;
  let body = `<h1>Day Plan</h1><h2>${format(date, 'EEEE, d MMMM yyyy')}</h2>`;
  if (clusters.length === 0) body += `<p>No items to display.</p>`;
  clusters.forEach(cluster => {
    const cols = cluster[0]?.cols || 1;
    const perCol: number[] = Array.from({ length: cols }, () => 0);
    cluster.forEach(it => { perCol[it.col] += 1; });
    const maxCount = Math.max(...perCol, 1);
    const groupHeight = maxCount * 88 + (maxCount - 1) * 8;
    const columnItems: (PlanItem & { col: number; cols: number })[][] = Array.from({ length: cols }, () => []);
    cluster.forEach(it => columnItems[it.col].push(it));
    columnItems.forEach(col => col.sort((a, b) => a.startMin - b.startMin));
    body += `<div class="cluster" style="height:${groupHeight}px">`;
    columnItems.forEach(colItems => {
      const stretchH = colItems.length ? (groupHeight - (colItems.length - 1) * 8) / colItems.length : groupHeight;
      body += `<div class="col">`;
      colItems.forEach(it => {
        const border = colour ? it.color : '#000';
        const bg = colour ? `${it.color}18` : '#fff';
        body += `<div class="box" style="height:${stretchH}px;border-color:${border};background:${bg};"><div class="type">${TYPE_LABEL[it.type]}</div><div class="title">${escapeHtml(it.title)}</div><div class="time">${fmt(it.startMin, format12)} – ${fmt(it.endMin, format12)} · ${durLabel(it.endMin - it.startMin)}</div></div>`;
      });
      body += `</div>`;
    });
    body += `</div>`;
  });
  return `<!doctype html><html><head><meta charset="utf-8"><title>Day Plan — ${format(date, 'yyyy-MM-dd')}</title><style>${style}</style></head><body>${body}</body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}