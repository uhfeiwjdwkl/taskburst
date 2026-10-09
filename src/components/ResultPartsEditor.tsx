import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ResultPartFields } from '@/components/ResultPartFields';
import { ResultPart, emptyResultPart, resolveResultPart } from '@/lib/resultParts';
export function ResultPartsEditor({ open, onClose, onSave, parts, itemName }: { open: boolean; onClose: () => void; onSave: (parts: ResultPart[]) => void; parts: ResultPart[]; itemName: string }) {
 const [edited, setEdited] = useState<ResultPart[]>([]);
 useEffect(() => { if (open) setEdited(parts.length ? structuredClone(parts) : [emptyResultPart()]); }, [open, parts]);
 return <Dialog open={open} onOpenChange={value => { if (!value) onClose(); }}><DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto" onPointerDownOutside={e => e.preventDefault()}><DialogHeader><DialogTitle>Edit Parts — {itemName}</DialogTitle></DialogHeader>
 {edited.map((part, index) => <ResultPartFields key={index} part={part} label={`Part ${index + 1}`} onChange={value => setEdited(edited.map((p, i) => i === index ? value : p))} onRemove={edited.length > 1 ? () => setEdited(edited.filter((_, i) => i !== index)) : undefined} />)}
 <Button type="button" variant="outline" onClick={() => setEdited([...edited, emptyResultPart()])}><Plus className="h-4 w-4 mr-2" />Add Part</Button><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(edited.map(resolveResultPart))}>Save Parts</Button></DialogFooter></DialogContent></Dialog>;
}
