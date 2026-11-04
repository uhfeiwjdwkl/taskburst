import { useEffect, useState } from 'react';
import { ResultPart, emptyResultPart, resolveResultPart } from '@/lib/resultParts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Flag, Plus, Trash2 } from 'lucide-react';

export const formatFraction = (score: number | null, max: number | null) =>
  score === null && max === null ? '' : `${score === null ? '' : Number(score.toFixed(2))}/${max ?? ''}`;

/** Parse "4/6", "4" or "/6" into score/max; blank → nulls. 0 is a valid score. */
export const parseFraction = (text: string): { score: number | null; maxScore: number | null } => {
  const [a, b] = text.split('/');
  const num = (v?: string) => (v === undefined || v.trim() === '' || !Number.isFinite(Number(v)) ? null : Number(v));
  return { score: num(a), maxScore: num(b) };
};

export function FractionInput({ score, maxScore, onChange, disabled, label }: {
  score: number | null; maxScore: number | null; onChange: (v: { score: number | null; maxScore: number | null }) => void; disabled?: boolean; label: string;
}) {
  const [text, setText] = useState(formatFraction(score, maxScore));
  useEffect(() => { const p = parseFraction(text); if (p.score !== score || p.maxScore !== maxScore) setText(formatFraction(score, maxScore)); }, [score, maxScore]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Input aria-label={label} placeholder="4/6" value={text} disabled={disabled} className="h-8 w-20 px-2 text-sm"
    onChange={e => { setText(e.target.value); onChange(parseFraction(e.target.value)); }} />;
}

export function ResultPartFields({ part, onChange, onRemove, readOnly = false, label = 'Part' }: {
  part: ResultPart; onChange?: (part: ResultPart) => void; onRemove?: () => void; readOnly?: boolean; label?: string;
}) {
  const derived = resolveResultPart(part);
  const change = (patch: Partial<ResultPart>) => onChange?.(resolveResultPart({ ...part, ...patch }));
  return <div className={`space-y-1 border-b py-2 ${part.flagged ? 'border-destructive' : 'border-border'}`}>
    {readOnly ? <div className="flex items-center gap-2 text-sm">
      {part.flagged && <Flag className="h-3 w-3 text-destructive fill-current" />}
      <span className="flex-1">{part.name || '—'}</span>
      <span>{derived.score !== null ? `${Number(derived.score.toFixed(2))}/${derived.maxScore ?? '—'}` : '—'}</span>
    </div> : <>
      <div className="flex items-center gap-1">
        <Input aria-label={`${label} name`} placeholder="Name" value={part.name} onChange={e => change({ name: e.target.value })} className="h-8 min-w-0 flex-1 text-sm" />
        <FractionInput label={`${label} score`} score={derived.score} maxScore={derived.maxScore} disabled={!!part.subparts?.length} onChange={v => change(v)} />
        <Input aria-label={`${label} weight`} title="Weight" type="number" step="any" min="0" value={part.weight ?? 1} onChange={e => change({ weight: e.target.value === '' ? 1 : Number(e.target.value) })} className="h-8 w-14 px-2 text-sm" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Flag" aria-label="Flag part" onClick={() => change({ flagged: !part.flagged })}><Flag className={`h-3.5 w-3.5 ${part.flagged ? 'text-destructive fill-current' : ''}`} /></Button>
        {onRemove && <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Remove" aria-label="Remove part" onClick={onRemove}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}
      </div>
      <Textarea aria-label={`${label} note`} placeholder="Note / mistake" rows={1} className="min-h-8 py-1 text-sm" value={part.notes || ''} onChange={e => change({ notes: e.target.value })} />
    </>}
    {readOnly && part.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap">{part.notes}</p>}
    {(part.subparts?.length || !readOnly) ? <details>
      <summary className="cursor-pointer text-xs text-muted-foreground">Subparts{part.subparts?.length ? ` (${part.subparts.length}) …` : ''}</summary>
      <div className="pl-3 border-l border-border mt-1">
        {!readOnly && <div className="flex gap-1"><Button type="button" size="sm" className="h-7" variant={part.subpartMode !== 'average' ? 'default' : 'outline'} onClick={() => change({ subpartMode: 'marks' })}>Sum</Button><Button type="button" size="sm" className="h-7" variant={part.subpartMode === 'average' ? 'default' : 'outline'} onClick={() => change({ subpartMode: 'average' })}>Average</Button></div>}
        {part.subparts?.map((child, index) => <ResultPartFields key={index} part={child} label={`${label} subpart ${index + 1}`} readOnly={readOnly} onChange={value => change({ subparts: part.subparts?.map((p, i) => i === index ? value : p) })} onRemove={readOnly ? undefined : () => change({ subparts: part.subparts?.filter((_, i) => i !== index) })} />)}
        {!readOnly && <Button type="button" variant="outline" size="sm" className="mt-1 h-7" onClick={() => change({ subparts: [...(part.subparts || []), emptyResultPart()] })}><Plus className="h-3 w-3 mr-1" />Add subpart</Button>}
      </div>
    </details> : null}
  </div>;
}
