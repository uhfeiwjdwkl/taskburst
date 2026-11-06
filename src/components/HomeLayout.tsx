import { createContext, useContext, useState, useEffect, useRef, ReactNode, DragEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, LayoutDashboard, Check, GripVertical, MoveDiagonal2, RotateCcw, ExternalLink, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DayTimetableView } from '@/components/DayTimetableView';
import { DEFAULT_PAGES } from '@/types/settings';
import { cn } from '@/lib/utils';

export const GRID_COLUMNS = 6;
const ROW_PX = 80;

/** cols: 1–6 grid columns; rows: 0 = automatic height, otherwise grid rows of ROW_PX. */
export type Widget = { id: string; kind: string; cols: number; rows: number; border?: boolean; reserveSpace?: boolean };

const defaults: Widget[] = [
  { id: 'timer', kind: 'timer', cols: 3, rows: 0 },
  { id: 'calendar', kind: 'calendar', cols: 3, rows: 0 },
  { id: 'tasks', kind: 'tasks', cols: 6, rows: 0 },
  { id: 'lists', kind: 'lists', cols: 3, rows: 0 },
  { id: 'timetables', kind: 'timetables', cols: 3, rows: 0 },
];
const builtInNames: Record<string, string> = { timer: 'Timer', calendar: 'Day calendar', tasks: 'Tasks', lists: 'Favourite lists', timetables: 'Favourite timetables' };
const sizeToCols: Record<string, number> = { small: 2, half: 3, full: 6 };

function readJson<T>(key: string, fallback: T): T {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v ?? fallback; } catch { return fallback; }
}

function loadWidgets(): Widget[] {
  const value = readJson<any[]>('homeWidgetLayout', defaults);
  if (!Array.isArray(value)) return defaults;
  return value.filter(w => w && w.kind).map(w => ({
    id: String(w.id),
    kind: String(w.kind),
    cols: Math.max(1, Math.min(GRID_COLUMNS, Number(w.cols) || sizeToCols[w.size] || 3)),
    rows: Math.max(0, Number(w.rows) || 0),
    border: Boolean(w.border),
    reserveSpace: Boolean(w.reserveSpace),
  }));
}

type Ctx = {
  widgets: Widget[];
  editing: boolean;
  update: (id: string, patch: Partial<Widget>) => void;
  remove: (id: string) => void;
  moveBefore: (dragId: string, targetId: string | null) => void;
  gridRef: React.RefObject<HTMLDivElement>;
};
const Context = createContext<Ctx | null>(null);

function widgetName(kind: string): string {
  if (builtInNames[kind]) return builtInNames[kind];
  const [type, ref] = kind.split(':');
  if (type === 'list') return `List: ${readJson<any[]>('lists', []).find(l => l.id === ref)?.name || 'missing list'}`;
  if (type === 'timetable') return `Timetable: ${readJson<any[]>('timetables', []).find(t => t.id === ref)?.name || 'missing timetable'}`;
  if (type === 'link') return `Button: ${DEFAULT_PAGES.find(p => p.path === ref)?.name || ref}`;
  return kind;
}

export function HomeLayout({ children }: { children: ReactNode }) {
  const [widgets, setWidgets] = useState<Widget[]>(loadWidgets);
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState('calendar');
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => { localStorage.setItem('homeWidgetLayout', JSON.stringify(widgets)); }, [widgets]);

  const update = (id: string, patch: Partial<Widget>) => setWidgets(ws => ws.map(w => w.id === id ? { ...w, ...patch } : w));
  const remove = (id: string) => setWidgets(ws => ws.filter(w => w.id !== id));
  const moveBefore = (dragId: string, targetId: string | null) => setWidgets(ws => {
    const dragged = ws.find(w => w.id === dragId);
    if (!dragged || dragId === targetId) return ws;
    const rest = ws.filter(w => w.id !== dragId);
    const at = targetId ? rest.findIndex(w => w.id === targetId) : rest.length;
    rest.splice(at < 0 ? rest.length : at, 0, dragged);
    return rest;
  });

  const lists = readJson<any[]>('lists', []);
  const timetables = readJson<any[]>('timetables', []);
  const options: [string, string][] = [
    ...Object.entries(builtInNames),
    ...lists.map(l => [`list:${l.id}`, `List: ${l.name}`] as [string, string]),
    ...timetables.map(t => [`timetable:${t.id}`, `Timetable: ${t.name}`] as [string, string]),
    ...DEFAULT_PAGES.filter(p => p.path !== '/').map(p => [`link:${p.path}`, `Button: ${p.name}`] as [string, string]),
  ];

  return (
    <Context.Provider value={{ widgets, editing, update, remove, moveBefore, gridRef }}>
      <div className="flex flex-wrap justify-end gap-2 mb-4">
        {editing && (
          <>
            <Select value={kind} onValueChange={setKind}>
              <SelectTrigger className="w-full sm:w-60" aria-label="Widget to add"><SelectValue /></SelectTrigger>
              <SelectContent>{options.map(([k, n]) => <SelectItem key={k} value={k}>{n}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setWidgets(ws => [...ws, { id: crypto.randomUUID(), kind, cols: kind.startsWith('link:') ? 1 : 3, rows: 0 }])}>
              <Plus className="h-4 w-4 mr-1" />Add widget
            </Button>
            <Button variant="outline" onClick={() => setWidgets(defaults)}><RotateCcw className="h-4 w-4 mr-1" />Reset</Button>
          </>
        )}
        <Button variant={editing ? 'default' : 'outline'} onClick={() => setEditing(e => !e)}>
          {editing ? <><Check className="h-4 w-4 mr-2" />Done</> : <><LayoutDashboard className="h-4 w-4 mr-2" />Edit layout</>}
        </Button>
      </div>
      <div
        ref={gridRef}
        className={cn('grid grid-cols-1 lg:grid-cols-6 gap-6 relative', editing && 'home-layout-editing rounded-lg p-2')}
        onDragOver={editing ? (e => e.preventDefault()) : undefined}
        onDrop={editing ? (e => { const id = e.dataTransfer.getData('application/home-widget'); if (id) moveBefore(id, null); }) : undefined}
      >
        {children}
        {widgets.filter(w => !builtInNames[w.kind]).map(w => (
          <WidgetFrame key={w.id} widget={w}><CustomWidget kind={w.kind} /></WidgetFrame>
        ))}
      </div>
    </Context.Provider>
  );
}

function CustomWidget({ kind }: { kind: string }) {
  const navigate = useNavigate();
  const [type, ref] = kind.split(':');
  if (type === 'link') {
    const page = DEFAULT_PAGES.find(p => p.path === ref);
    return <Button variant="outline" className="w-full h-full min-h-12" onClick={() => navigate(ref)}><ExternalLink className="h-4 w-4 mr-2" />{page?.name || ref}</Button>;
  }
  if (type === 'list') {
    const list = readJson<any[]>('lists', []).find(l => l.id === ref);
    if (!list) return <Card className="p-4 text-sm text-muted-foreground">This list no longer exists.</Card>;
    return (
      <Card className="p-4 h-full overflow-auto">
        <button className="font-semibold text-lg mb-2 hover:underline" onClick={() => navigate('/lists')}>{list.name}</button>
        <ul className="space-y-1 text-sm">
          {(list.items || []).map((item: any) => <li key={item.id} className={cn(item.completed && 'line-through text-muted-foreground')}>{item.title || item.text || item.name}</li>)}
          {!(list.items || []).length && <li className="text-muted-foreground">No items</li>}
        </ul>
      </Card>
    );
  }
  if (type === 'timetable') {
    const tt = readJson<any[]>('timetables', []).find(t => t.id === ref);
    if (!tt) return <Card className="p-4 text-sm text-muted-foreground">This timetable no longer exists.</Card>;
    return <Card className="p-4 h-full overflow-auto"><h3 className="font-semibold text-lg mb-2">{tt.name}</h3><DayTimetableView timetableId={tt.id} showEvents={false} events={[]} selectedDate={new Date()} onEventClick={() => navigate('/timetable')} /></Card>;
  }
  return null;
}

function WidgetFrame({ widget, children }: { widget: Widget; children: ReactNode }) {
  const ctx = useContext(Context);
  if (!ctx) return <>{children}</>;
  const { editing, widgets, update, remove, moveBefore, gridRef } = ctx;
  const [dropHere, setDropHere] = useState(false);
  const order = widgets.findIndex(w => w.id === widget.id);

  const startResize = (e: ReactPointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const grid = gridRef.current; const frame = (e.currentTarget as HTMLElement).closest('section');
    if (!grid || !frame) return;
    const gridRect = grid.getBoundingClientRect(); const frameRect = frame.getBoundingClientRect();
    const colWidth = gridRect.width / GRID_COLUMNS;
    const onMove = (ev: PointerEvent) => {
      const cols = Math.max(1, Math.min(GRID_COLUMNS, Math.round((ev.clientX - frameRect.left) / colWidth)));
      const rows = Math.max(1, Math.round((ev.clientY - frameRect.top) / ROW_PX));
      update(widget.id, { cols, rows });
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
  };

  const spanClass = ['lg:col-span-1', 'lg:col-span-2', 'lg:col-span-3', 'lg:col-span-4', 'lg:col-span-5', 'lg:col-span-6'][widget.cols - 1];
  return (
    <section
      data-home-widget={widget.kind}
      style={{ order, height: widget.rows ? widget.rows * ROW_PX : undefined }}
      data-sized={widget.rows ? '' : undefined}
      className={cn('min-w-0 relative flex flex-col', spanClass, widget.border && 'border border-border rounded-md p-2', widget.reserveSpace && 'min-h-40', editing && 'rounded-lg ring-2 ring-primary/40 bg-background/70')}
      onDragOver={editing ? ((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDropHere(true); }) : undefined}
      onDragLeave={editing ? () => setDropHere(false) : undefined}
      onDrop={editing ? ((e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDropHere(false); const id = e.dataTransfer.getData('application/home-widget'); if (id) moveBefore(id, widget.id); }) : undefined}
    >
      {dropHere && <span aria-hidden className="absolute -left-3.5 top-0 bottom-0 w-1 rounded-full bg-primary z-30" />}
      {editing && (
        <div className="sticky top-0 z-20 flex items-center gap-1 bg-primary text-primary-foreground rounded-t-md px-2 py-1 text-xs">
          <span draggable onDragStart={e => e.dataTransfer.setData('application/home-widget', widget.id)} className="cursor-grab flex items-center gap-1 flex-1 min-w-0" title="Drag to move">
            <GripVertical className="h-4 w-4 shrink-0" /><span className="truncate">{widgetName(widget.kind)} · {widget.cols}/{GRID_COLUMNS} wide{widget.rows ? ` · ${widget.rows} tall` : ''}</span>
          </span>
          {widget.rows > 0 && <button className="underline" onClick={() => update(widget.id, { rows: 0 })}>Auto height</button>}
          <Button size="icon" variant="ghost" className="h-6 w-6" aria-label="Widget border" title="Widget border" aria-pressed={Boolean(widget.border)} onClick={() => update(widget.id, { border: !widget.border })}><Square className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="ghost" className="h-6 px-1 text-xs" aria-pressed={Boolean(widget.reserveSpace)} onClick={() => update(widget.id, { reserveSpace: !widget.reserveSpace })}>Reserve space{widget.reserveSpace ? ' ✓' : ''}</Button>
          <button aria-label={`Remove ${widgetName(widget.kind)}`} onClick={() => remove(widget.id)} className="p-1"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      )}
      <div className={cn('home-widget-body flex-1 min-h-0 flex flex-col', widget.rows && 'overflow-auto', editing && 'pointer-events-none select-none')}>{children}</div>
      {editing && (
        <button aria-label="Resize widget" onPointerDown={startResize} className="absolute bottom-0 right-0 z-20 h-6 w-6 flex items-center justify-center rounded-tl-md bg-primary text-primary-foreground cursor-nwse-resize touch-none">
          <MoveDiagonal2 className="h-3.5 w-3.5" />
        </button>
      )}
    </section>
  );
}

export function HomeWidget({ kind, children, valid = true }: { kind: string; children?: ReactNode; valid?: boolean }) {
  const ctx = useContext(Context);
  if (!ctx) return <>{children}</>;
  return <>{ctx.widgets.filter(w => w.kind === kind && (valid || ctx.editing || w.reserveSpace)).map(w => <WidgetFrame key={w.id} widget={w}>{valid ? children : ctx.editing ? <div className="p-4 text-sm text-muted-foreground">{widgetName(kind)}</div> : null}</WidgetFrame>)}</>;
}
