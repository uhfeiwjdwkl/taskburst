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
import { Clock, Trash2, ArrowUpRight } from 'lucide-react';
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

  useEffect(() => {
    if (!slot || !open) return;
    setDate(slot.date);
    setTime(slot.time);
    setDuration(slot.duration || 30);
    setCompleted(Boolean(slot.completed));
    setNote(slot.note || '');
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
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};