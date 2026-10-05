import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Clock, Trash2, ArrowUpRight, Check, Undo, Edit, Calendar as CalendarIcon } from 'lucide-react';
import { findListItem, updateStoredListItem } from '@/lib/listItemStore';
import { formatTimeTo12Hour } from '@/lib/dateFormat';
import { PartialSlot, updatePartialSlot, deletePartialSlot } from '@/lib/partialSchedule';

interface PartialSlotDialogProps {
  slot: PartialSlot | null;
  open: boolean;
  onClose: () => void;
  /** Called after the slot list changed so callers can refresh. */
  onChanged?: () => void;
  /** Optional jump to the underlying task / list. */
  onOpenParent?: (slot: PartialSlot) => void;
  parentLabel?: string;
}

export const PartialSlotDialog = ({
  slot,
  open,
  onClose,
  onChanged,
  onOpenParent,
  parentLabel,
}: PartialSlotDialogProps) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [completed, setCompleted] = useState(false);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!slot || !open) return;
    setDate(slot.date);
    setTime(slot.time);
    setDuration(slot.duration || 30);
    setCompleted(Boolean(slot.completed));
    setNote(slot.note || '');
    setEditing(false);
  }, [slot?.id, open]);

  if (!slot) return null;

  const save = () => {
    updatePartialSlot({
      ...slot,
      date: date || slot.date,
      time: time || slot.time,
      duration: duration || slot.duration,
      completed,
      note: note.trim() || undefined,
    });
    onChanged?.();
    onClose();
  };

  const remove = () => {
    deletePartialSlot(slot.id);
    onChanged?.();
    onClose();
  };

  const toggleComplete = () => {
    const next = !slot.completed;
    updatePartialSlot({ ...slot, completed: next });
    // A list-item session completes the list item itself so the list stays in sync.
    if (slot.itemType === 'listItem') {
      const found = findListItem(slot.itemId, slot.listId);
      if (found) updateStoredListItem(found.list.id, { ...found.item, completed: next });
    }
    onChanged?.();
    onClose();
  };

  const endTime = (() => {
    if (!slot.time) return '';
    const [h, m] = slot.time.split(':').map(Number);
    const t = h * 60 + m + (slot.duration || 0);
    return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
  })();

  if (!editing) {
    const label = slot.itemType === 'task' ? 'Task session' : slot.itemType === 'subtask' ? 'Subtask session' : slot.itemType === 'list' ? 'List session' : 'List item session';
    return (
      <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Clock className="h-4 w-4" />{slot.itemTitle || label}</DialogTitle>
            <DialogDescription>{label}{slot.completed ? ' • Done' : ''}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1"><CalendarIcon className="h-3 w-3" />{slot.date ? new Date(slot.date + 'T00:00').toLocaleDateString('en-GB') : '—'}</span>
              {slot.time && <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1"><Clock className="h-3 w-3" />{formatTimeTo12Hour(slot.time)} – {formatTimeTo12Hour(endTime)}</span>}
              <span className="rounded-md border px-2 py-1">{slot.duration || 0} min</span>
            </div>
            {slot.note && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{slot.note}</p>}
            {onOpenParent && (
              <Button variant="outline" className="w-full" onClick={() => onOpenParent(slot)}>
                <ArrowUpRight className="h-4 w-4 mr-2" />Open {parentLabel || 'parent item'}
              </Button>
            )}
            <Button size="lg" className="w-full h-12 text-base" variant={slot.completed ? 'outline' : 'default'} onClick={toggleComplete}>
              {slot.completed ? <Undo className="h-5 w-5 mr-2" /> : <Check className="h-5 w-5 mr-2" />}
              {slot.completed ? 'Mark Incomplete' : 'Complete'}
            </Button>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="destructive" size="icon" onClick={remove} className="mr-auto" aria-label="Delete session"><Trash2 className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={() => setEditing(true)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const typeLabel =
    slot.itemType === 'task'
      ? 'Task session'
      : slot.itemType === 'subtask'
        ? 'Subtask session'
        : slot.itemType === 'list'
          ? 'List session'
          : 'List item session';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Edit scheduled session
          </DialogTitle>
          <DialogDescription>
            {typeLabel}{slot.itemTitle ? ` — ${slot.itemTitle}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Duration (minutes)</Label>
            <Input
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Note</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="What will you work on in this session?"
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="slot-completed" checked={completed} onCheckedChange={(v) => setCompleted(Boolean(v))} />
            <Label htmlFor="slot-completed" className="cursor-pointer">Mark this session as done</Label>
          </div>

          {onOpenParent && (
            <Button variant="outline" className="w-full" onClick={() => onOpenParent(slot)}>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Open {parentLabel || 'parent item'}
            </Button>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={remove} className="mr-auto">
            <Trash2 className="h-4 w-4 mr-1" /> Delete slot
          </Button>
          <Button variant="outline" onClick={() => setEditing(false)}>Back</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};