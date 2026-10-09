import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResultPartFields } from '@/components/ResultPartFields';
import { ResultPart, emptyResultPart, resolveResultPart } from '@/lib/resultParts';
export function ResultCellDialog({ open, onClose, onSave, initialData }: { open: boolean; onClose: () => void; onSave: (score: number | null, maxScore: number | null, notes: string, part: ResultPart) => void; initialData: ResultPart | null }) {
 const [part, setPart] = useState<ResultPart>(emptyResultPart);
 useEffect(() => { if (open) setPart(initialData ? structuredClone(initialData) : emptyResultPart()); }, [open, initialData]);
 return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}><DialogHeader><DialogTitle>Edit Score — {initialData?.name || 'Part'}</DialogTitle></DialogHeader><ResultPartFields part={part} onChange={setPart} /><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => { const p = resolveResultPart(part); onSave(p.score, p.maxScore, p.notes || '', p); }}>Save</Button></DialogFooter></DialogContent></Dialog>;
}
