import { ResultPart, emptyResultPart, resolveResultPart } from '@/lib/resultParts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Plus, Trash2 } from 'lucide-react';

export function ResultPartFields({ part, onChange, onRemove, readOnly = false, label = 'Part' }: {
  part: ResultPart; onChange?: (part: ResultPart) => void; onRemove?: () => void; readOnly?: boolean; label?: string;
}) {
  const derived = resolveResultPart(part);
  const change = (patch: Partial<ResultPart>) => onChange?.(resolveResultPart({ ...part, ...patch }));
  return <div className={`space-y-2 border-b border-border py-3 ${part.flagged ? 'border-destructive' : ''}`}>
    {readOnly ? <div className="flex items-center gap-2 text-sm">
      {part.flagged && <Flag className="h-3 w-3 text-destructive fill-current" />}
      <span className="flex-1">{part.name || label}</span>
      <span>{derived.score !== null ? `${Number(derived.score.toFixed(2))}/${derived.maxScore ?? '—'}` : '—'}</span>
    </div> : <>
      <div className="flex items-center gap-2">
        <Input aria-label={`${label} name`} placeholder="Part name" value={part.name} onChange={e => change({ name: e.target.value })} className="min-w-0 flex-1" />
        <Button type="button" variant="ghost" size="icon" title="Flag part" aria-label="Flag part" onClick={() => change({ flagged: !part.flagged })}><Flag className={`h-4 w-4 ${part.flagged ? 'text-destructive fill-current' : ''}`} /></Button>
        {onRemove && <Button type="button" variant="ghost" size="icon" title="Remove part" onClick={onRemove}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs">Score<Input aria-label={`${label} score`} type="number" step="any" min="0" value={derived.score ?? ''} disabled={!!part.subparts?.length} onChange={e => change({ score: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        <label className="text-xs">Max score<Input aria-label={`${label} max score`} type="number" step="any" min="0" value={derived.maxScore ?? ''} disabled={!!part.subparts?.length} onChange={e => change({ maxScore: e.target.value === '' ? null : Number(e.target.value) })} /></label>
        <label className="text-xs">Weight<Input aria-label={`${label} weight`} type="number" step="any" min="0" value={part.weight ?? 1} onChange={e => change({ weight: e.target.value === '' ? 1 : Number(e.target.value) })} /></label>
      </div>
      <Textarea aria-label={`${label} note`} placeholder="Note / mistake" rows={2} value={part.notes || ''} onChange={e => change({ notes: e.target.value })} />
    </>}
    {readOnly && part.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{part.notes}</p>}
    {(part.subparts?.length || !readOnly) ? <details open={!readOnly && !!part.subparts?.length}>
      <summary className="cursor-pointer text-sm text-muted-foreground">Subparts{part.subparts?.length ? ` (${part.subparts.length}) …` : ''}</summary>
      <div className="pl-3 border-l border-border mt-2">
        {!readOnly && <div className="flex gap-2"><Button type="button" size="sm" variant={part.subpartMode !== 'average' ? 'default' : 'outline'} onClick={() => change({ subpartMode: 'marks' })}>Sum</Button><Button type="button" size="sm" variant={part.subpartMode === 'average' ? 'default' : 'outline'} onClick={() => change({ subpartMode: 'average' })}>Average</Button></div>}
        {part.subparts?.map((child, index) => <ResultPartFields key={index} part={child} label={`${label} subpart ${index + 1}`} readOnly={readOnly} onChange={value => change({ subparts: part.subparts?.map((p, i) => i === index ? value : p) })} onRemove={readOnly ? undefined : () => change({ subparts: part.subparts?.filter((_, i) => i !== index) })} />)}
        {!readOnly && <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => change({ subparts: [...(part.subparts || []), emptyResultPart()] })}><Plus className="h-3 w-3 mr-1" />Add subpart</Button>}
      </div>
    </details> : null}
  </div>;
}