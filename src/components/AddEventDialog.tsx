import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ImportEventButton } from '@/components/ImportEventButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CalendarEvent } from '@/types/event';

interface AddEventDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  prefilledDate?: string;
}

export function AddEventDialog({ open, onClose, onAdd, prefilledDate }: AddEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(prefilledDate || '');
  const [endDate, setEndDate] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState('7');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date) {
      return;
    }

    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      endDate: isMultiDay && endDate ? endDate : undefined,
      time: time || undefined,
      duration: time ? parseInt(duration) || 60 : undefined,
      location: location.trim() || undefined,
      recurring: isRecurring ? {
        enabled: true,
        intervalDays: parseInt(recurringDays) || 7
      } : undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDate(prefilledDate || '');
    setEndDate('');
    setIsMultiDay(false);
    setTime('');
    setDuration('60');
    setLocation('');
    setIsRecurring(false);
    setRecurringDays('7');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add Calendar Event</span>
            <ImportEventButton onImport={onAdd} />
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Event title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Event description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">{isMultiDay ? 'Start Date *' : 'Date *'}</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="multiDay"
                checked={isMultiDay}
                onCheckedChange={(checked) => setIsMultiDay(checked as boolean)}
              />
              <Label htmlFor="multiDay" className="cursor-pointer">
                Multi-day event (e.g., trip)
              </Label>
            </div>

            {isMultiDay && (
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={date}
                  required={isMultiDay}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="15"
                  step="15"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  disabled={!time}
                  placeholder="60"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Event location (optional)"
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="recurring"
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked as boolean)}
                />
                <Label htmlFor="recurring" className="cursor-pointer">
                  Recurring event
                </Label>
              </div>
              
              {isRecurring && (
                <div className="space-y-2 pl-6">
                  <Label htmlFor="recurringDays">Repeat every (days)</Label>
                  <Input
                    id="recurringDays"
                    type="number"
                    min="1"
                    value={recurringDays}
                    onChange={(e) => setRecurringDays(e.target.value)}
                    placeholder="7"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || !date}>
              Add Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
