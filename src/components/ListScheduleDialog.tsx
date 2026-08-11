import { useEffect, useState } from 'react';
import { List } from '@/types/list';
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
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import {
  PartialSlot,
  loadPartialSlots,
  addPartialSlot,
  deletePartialSlot,
} from '@/lib/partialSchedule';
import { UniversalDayCalendar } from '@/components/UniversalDayCalendar';

interface ListScheduleDialogProps {
  list: List | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Schedules a list (or one of its items) into one or more time slots, exactly
 * like subtask scheduling. Slots render on every day calendar and can be
 * started/edited from there.
 */
export const ListScheduleDialog = ({ list, open, onClose }: ListScheduleDialogProps) => {
  const [slots, setSlots] = useState<PartialSlot[]>([]);
  const [targetItemId, setTargetItemId] = useState<string>('__list__');
  const [draft, setDraft] = useState({ date: format(new Date(), 'yyyy-MM-dd'), time: '', duration: 30 });

  const refresh = () => setSlots(loadPartialSlots());

  useEffect(() => {
    if (open) {
      refresh();
      setTargetItemId('__list__');
    }
  }, [open, list?.id]);

  if (!list) return null;

  const usingItem = targetItemId !== '__list__';
  const item = usingItem ? list.items.find((i) => i.id === targetItemId) : undefined;
  const itemId = usingItem ? targetItemId : list.id;
  const itemTitle = usingItem ? (item?.title || 'List item') : list.title;

  const mySlots = slots
    .filter((s) => s.itemId === itemId)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const add = () => {
    if (!draft.date || !draft.time || !draft.duration) return;
    addPartialSlot({
      itemId,
      itemType: usingItem ? 'listItem' : 'list',
      itemTitle,
      listId: list.id,
      date: draft.date,
      time: draft.time,
      duration: draft.duration,
    });
    refresh();
    setDraft({ ...draft, time: '' });
  };

  const remove = (id: string) => {
    deletePartialSlot(id);
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Schedule — {list.title}
          </DialogTitle>
          <DialogDescription>
            Add one or more time slots for the whole list or a single item.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs">What to schedule</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge
                variant={usingItem ? 'outline' : 'default'}
                className="cursor-pointer"
                onClick={() => setTargetItemId('__list__')}
              >
                Whole list
              </Badge>
              {list.items.map((i) => (
                <Badge
                  key={i.id}
                  variant={targetItemId === i.id ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setTargetItemId(i.id)}
                >
                  {i.title}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 items-end">
            <div>
              <Label className="text-xs">Date</Label>
              <Input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Time</Label>
              <Input type="time" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Duration (min)</Label>
              <Input
                type="number"
                min={1}
                value={draft.duration}
                onChange={(e) => setDraft({ ...draft, duration: parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button size="sm" onClick={add}>Add Slot</Button>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Slots for “{itemTitle}”</Label>
            {mySlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No slots scheduled yet.</p>
            ) : (
              mySlots.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <span>{s.date} • {s.time} • {s.duration}m</span>
                  <Button size="sm" variant="ghost" onClick={() => remove(s.id)}>Remove</Button>
                </div>
              ))
            )}
          </div>

          <div className="h-[380px] border-t pt-3">
            <UniversalDayCalendar
              date={draft.date ? new Date(`${draft.date}T00:00:00`) : new Date()}
              onDateChange={(d) => setDraft({ ...draft, date: format(d, 'yyyy-MM-dd') })}
              showCard={false}
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};