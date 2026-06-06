import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Save, Undo2, Redo2, RotateCcw, Trash2, Plus, ChevronDown, ChevronRight, Code2, FormInput } from 'lucide-react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Canonical list of keys to expose. Any other keys present in localStorage
// (excluding sb-* / supabase.*) are automatically discovered and added.
const KNOWN_KEYS = [
  'tasks',
  'deletedTasks',
  'archivedTasks',
  'deletedArchive',
  'calendarEvents',
  'timetables',
  'lists',
  'deletedListItems',
  'sessions',
  'deletedSessions',
  'projects',
  'deletedProjects',
  'progressGridFilledIndices',
  'resultsColumnNames',
  'assessments',
  'assessmentTypes',
  'deletedAssessments',
  'flexibleTimetableEvents',
  'categories',
  'subcategories',
  'appSettings',
  'textBackups',
];

function isSyncableKey(k: string) {
  return !k.startsWith('sb-') && !k.startsWith('supabase.') && !k.startsWith('kommenszlapf:');
}

function readAll(): Record<string, any> {
  const out: Record<string, any> = {};
  const seen = new Set<string>();
  for (const k of KNOWN_KEYS) {
    seen.add(k);
    const raw = localStorage.getItem(k);
    if (raw === null) continue;
    try { out[k] = JSON.parse(raw); } catch { out[k] = raw; }
  }
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k || seen.has(k) || !isSyncableKey(k)) continue;
    const raw = localStorage.getItem(k);
    if (raw === null) continue;
    try { out[k] = JSON.parse(raw); } catch { out[k] = raw; }
  }
  return out;
}

// ---------- Visual value editors ----------

function PrimitiveEditor({ value, onChange }: { value: any; onChange: (v: any) => void }) {
  if (typeof value === 'boolean') {
    return <Switch checked={value} onCheckedChange={onChange} />;
  }
  if (typeof value === 'number') {
    return (
      <Input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? 0 : Number(v));
        }}
        className="h-8"
      />
    );
  }
  if (value === null) {
    return <Input value="(null)" disabled className="h-8" />;
  }
  // string (or anything else stringified)
  const str = typeof value === 'string' ? value : String(value);
  if (str.length > 80 || str.includes('\n')) {
    return (
      <Textarea
        value={str}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[60px] font-mono text-xs"
      />
    );
  }
  return <Input value={str} onChange={(e) => onChange(e.target.value)} className="h-8" />;
}

function ObjectEditor({
  value, onChange, depth = 0,
}: { value: Record<string, any>; onChange: (v: any) => void; depth?: number }) {
  const entries = Object.entries(value);
  return (
    <div className={depth === 0 ? 'space-y-2' : 'space-y-1 border-l pl-3 ml-1'}>
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[180px_1fr_auto] gap-2 items-start">
          <div className="text-xs font-mono text-muted-foreground pt-1.5 truncate" title={k}>{k}</div>
          <div>
            <ValueEditor
              value={v}
              onChange={(nv) => onChange({ ...value, [k]: nv })}
              depth={depth + 1}
            />
          </div>
          <Button
            variant="ghost" size="icon" className="h-7 w-7"
            onClick={() => {
              const copy = { ...value };
              delete copy[k];
              onChange(copy);
            }}
            title="Delete field"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <AddField onAdd={(k, v) => onChange({ ...value, [k]: v })} />
    </div>
  );
}

function AddField({ onAdd }: { onAdd: (key: string, value: any) => void }) {
  const [k, setK] = useState('');
  return (
    <div className="flex gap-1 pt-1">
      <Input
        placeholder="new field name"
        value={k}
        onChange={(e) => setK(e.target.value)}
        className="h-7 text-xs"
      />
      <Button
        variant="outline" size="sm" className="h-7"
        onClick={() => { if (k.trim()) { onAdd(k.trim(), ''); setK(''); } }}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>
  );
}

function ArrayEditor({
  value, onChange, depth = 0,
}: { value: any[]; onChange: (v: any) => void; depth?: number }) {
  return (
    <div className="space-y-1">
      {value.map((item, i) => {
        const label = item && typeof item === 'object' && !Array.isArray(item)
          ? (item.name ?? item.title ?? item.id ?? `item ${i}`)
          : `item ${i}`;
        return (
          <Collapsible key={i} defaultOpen={depth === 0 && value.length < 6}>
            <div className="flex items-center gap-1">
              <CollapsibleTrigger className="flex items-center gap-1 text-xs hover:underline">
                <ChevronRight className="h-3 w-3 transition-transform data-[state=open]:rotate-90" />
                <span className="font-mono">[{i}]</span>
                <span className="text-muted-foreground truncate max-w-[280px]">{String(label)}</span>
              </CollapsibleTrigger>
              <Button
                variant="ghost" size="icon" className="h-6 w-6 ml-auto"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                title="Remove item"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <CollapsibleContent className="pl-4 pt-1 pb-2">
              <ValueEditor
                value={item}
                onChange={(nv) => onChange(value.map((it, j) => (j === i ? nv : it)))}
                depth={depth + 1}
              />
            </CollapsibleContent>
          </Collapsible>
        );
      })}
      <Button
        variant="outline" size="sm" className="h-7"
        onClick={() => {
          const sample = value[0];
          let blank: any = '';
          if (sample && typeof sample === 'object' && !Array.isArray(sample)) {
            blank = Object.fromEntries(Object.keys(sample).map((k) => [k, '']));
          } else if (Array.isArray(sample)) blank = [];
          else if (typeof sample === 'number') blank = 0;
          else if (typeof sample === 'boolean') blank = false;
          onChange([...value, blank]);
        }}
      >
        <Plus className="h-3 w-3 mr-1" /> Add item
      </Button>
    </div>
  );
}

function ValueEditor({ value, onChange, depth = 0 }: { value: any; onChange: (v: any) => void; depth?: number }) {
  if (Array.isArray(value)) return <ArrayEditor value={value} onChange={onChange} depth={depth} />;
  if (value && typeof value === 'object') return <ObjectEditor value={value} onChange={onChange} depth={depth} />;
  return <PrimitiveEditor value={value} onChange={onChange} />;
}

// ---------- Page ----------

const Data = () => {
  const navigate = useNavigate();
  const [initial, setInitial] = useState<Record<string, any>>({});
  const [past, setPast] = useState<Record<string, any>[]>([]);
  const [present, setPresent] = useState<Record<string, any>>({});
  const [future, setFuture] = useState<Record<string, any>[]>([]);
  const [activeKey, setActiveKey] = useState<string>('');
  const [rawMode, setRawMode] = useState<Record<string, boolean>>({});
  const [rawDrafts, setRawDrafts] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    const all = readAll();
    setInitial(all);
    setPresent(all);
    setPast([]);
    setFuture([]);
    setRawDrafts({});
    const keys = Object.keys(all).sort();
    if (keys.length > 0 && !keys.includes(activeKey)) setActiveKey(keys[0]);
  }, [activeKey]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const keys = useMemo(() => Object.keys(present).sort(), [present]);
  const dirty = useMemo(
    () => JSON.stringify(present) !== JSON.stringify(initial),
    [present, initial],
  );

  const setKeyValue = (key: string, nextValue: any) => {
    setPast((p) => [...p, present]);
    setFuture([]);
    setPresent((prev) => ({ ...prev, [key]: nextValue }));
  };

  const undo = () => {
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [present, ...f]);
    setPresent(prev);
  };
  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, present]);
    setPresent(next);
  };

  const discard = () => { setPresent(initial); setPast([]); setFuture([]); setRawDrafts({}); toast.success('Changes discarded'); };

  const save = () => {
    // Validate any raw drafts before saving.
    for (const k of Object.keys(rawDrafts)) {
      try { JSON.parse(rawDrafts[k]); } catch {
        toast.error(`Raw JSON for "${k}" is invalid — fix or switch back to form view`);
        return;
      }
    }
    const merged: Record<string, any> = { ...present };
    for (const k of Object.keys(rawDrafts)) {
      try { merged[k] = JSON.parse(rawDrafts[k]); } catch { /* validated above */ }
    }
    // Write to localStorage. Deletions: keys present in initial but missing in merged.
    const initialKeys = new Set(Object.keys(initial));
    const mergedKeys = new Set(Object.keys(merged));
    for (const k of initialKeys) {
      if (!mergedKeys.has(k)) {
        try { localStorage.removeItem(k); } catch { /* ignore */ }
      }
    }
    for (const k of mergedKeys) {
      const v = merged[k];
      try {
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
      } catch { /* ignore */ }
    }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('appSettingsUpdated'));
    toast.success('Changes saved');
    setInitial(merged); setPresent(merged); setRawDrafts({}); setPast([]); setFuture([]);
  };

  const value = present[activeKey];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold flex-1">Data editor</h1>
          <Button variant="outline" size="sm" onClick={undo} disabled={past.length === 0}>
            <Undo2 className="h-4 w-4 mr-1" /> Undo
          </Button>
          <Button variant="outline" size="sm" onClick={redo} disabled={future.length === 0}>
            <Redo2 className="h-4 w-4 mr-1" /> Redo
          </Button>
          <Button variant="outline" size="sm" onClick={discard} disabled={!dirty && Object.keys(rawDrafts).length === 0}>
            <RotateCcw className="h-4 w-4 mr-1" /> Discard
          </Button>
          <Button size="sm" onClick={save} disabled={!dirty && Object.keys(rawDrafts).length === 0}>
            <Save className="h-4 w-4 mr-1" /> Save changes
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Edit any stored data directly. When signed in, saved changes
          automatically sync to your account.
        </p>

        {keys.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No data stored.</Card>
        ) : (
          <Tabs value={activeKey} onValueChange={setActiveKey}>
            <TabsList className="flex flex-wrap h-auto justify-start">
              {keys.map((k) => (
                <TabsTrigger key={k} value={k} className="text-xs">
                  {k}
                </TabsTrigger>
              ))}
            </TabsList>
            {keys.map((k) => (
              <TabsContent key={k} value={k}>
                <Card className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-mono text-muted-foreground">{k}</div>
                    <Button
                      variant="ghost" size="sm"
                      onClick={() => {
                        const nextRaw = !rawMode[k];
                        setRawMode((m) => ({ ...m, [k]: nextRaw }));
                        if (nextRaw) {
                          setRawDrafts((d) => ({
                            ...d,
                            [k]: typeof present[k] === 'string'
                              ? present[k]
                              : JSON.stringify(present[k] ?? null, null, 2),
                          }));
                        } else {
                          // Apply raw draft back into present if valid
                          const draft = rawDrafts[k];
                          if (draft !== undefined) {
                            try {
                              const parsed = JSON.parse(draft);
                              setKeyValue(k, parsed);
                            } catch {
                              toast.error('Raw JSON invalid — keeping previous value');
                            }
                            setRawDrafts((d) => { const c = { ...d }; delete c[k]; return c; });
                          }
                        }
                      }}
                    >
                      {rawMode[k]
                        ? <><FormInput className="h-3 w-3 mr-1" /> Form view</>
                        : <><Code2 className="h-3 w-3 mr-1" /> Raw JSON</>}
                    </Button>
                  </div>
                  {rawMode[k] ? (
                    <Textarea
                      value={rawDrafts[k] ?? ''}
                      onChange={(e) => setRawDrafts((d) => ({ ...d, [k]: e.target.value }))}
                      className="font-mono text-xs min-h-[400px]"
                    />
                  ) : (
                    <ValueEditor
                      value={value}
                      onChange={(nv) => setKeyValue(k, nv)}
                    />
                  )}
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Data;