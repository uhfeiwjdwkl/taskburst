export interface ResultPart {
  name: string;
  score: number | null;
  maxScore: number | null;
  weight?: number;
  notes?: string;
  flagged?: boolean;
  subparts?: ResultPart[];
  subpartMode?: 'marks' | 'average';
}

export const emptyResultPart = (): ResultPart => ({ name: '', score: null, maxScore: null, notes: '' });

/** Keep the breakdown intact and derive each parent from its scored children. */
export function resolveResultPart(part: ResultPart): ResultPart {
  if (!part.subparts?.length) return { ...part };
  const subparts = part.subparts.map(resolveResultPart);
  const scored = subparts.filter(p => p.score !== null && Number.isFinite(p.score) && (p.maxScore ?? 0) > 0);
  if (!scored.length) return { ...part, subparts, score: null, maxScore: null };
  if (part.subpartMode === 'average') {
    const weight = scored.reduce((sum, p) => sum + (p.weight ?? 1), 0);
    const score = weight > 0 ? scored.reduce((sum, p) => sum + (p.score ?? 0) / Number(p.maxScore) * 100 * (p.weight ?? 1), 0) / weight : null;
    return { ...part, subparts, score, maxScore: 100 };
  }
  return { ...part, subparts, score: scored.reduce((sum, p) => sum + (p.score ?? 0), 0), maxScore: scored.reduce((sum, p) => sum + Number(p.maxScore), 0) };
}

export function resultNotes(parts: ResultPart[], prefix = ''): { label: string; note: string }[] {
  return parts.flatMap((part, index) => {
    const label = [prefix, part.name || `Part ${index + 1}`].filter(Boolean).join(' › ');
    return [...(part.notes?.trim() ? [{ label, note: part.notes }] : []), ...resultNotes(part.subparts || [], label)];
  });
}