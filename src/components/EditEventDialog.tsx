import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { saveTextBackup, createFieldId } from '@/lib/textBackup';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { CalendarEvent } from '@/types/event';

interface EditEventDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onSave: (event: CalendarEvent) => void;
}

export function EditEventDialog({ event, open, onClose, onSave }: EditEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isMultiDay, setIsMultiDay] = useState(false);
  const [time, setTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState('60');
  const [location, setLocation] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState('7');
  const originalEventRef = useRef<CalendarEvent | null>(null);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setDate(event.date);
      setEndDate(event.endDate || '');
      setIsMultiDay(!!event.endDate);
      setTime(event.time || '');
      setEndTime(event.endTime || '');
      setDuration(event.duration?.toString() || '60');
      setLocation(event.location || '');
      setIsRecurring(event.recurring?.enabled || false);
      setRecurringDays(event.recurring?.intervalDays?.toString() || '7');
      originalEventRef.current = { ...event };
    }
  }, [event]);

  if (!event) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date) {
      return;
    }

    const original = originalEventRef.current;
    if (original) {
      if (original.title !== title.trim()) {
        saveTextBackup({
          fieldId: createFieldId('event', event.id, 'title'),
          fieldLabel: 'Title',
          previousContent: original.title,
          sourceType: 'event',
          sourceId: event.id,
          sourceName: original.title,
        });
      }
      if ((original.description || '') !== description.trim()) {
        saveTextBackup({
          fieldId: createFieldId('event', event.id, 'description'),
          fieldLabel: 'Description',
          previousContent: original.description || '',
          sourceType: 'event',
          sourceId: event.id,
          sourceName: title.trim(),
        });
      }
      if ((original.location || '') !== location.trim()) {
        saveTextBackup({
          fieldId: createFieldId('event', event.id, 'location'),
          fieldLabel: 'Location',
          previousContent: original.location || '',
          sourceType: 'event',
          sourceId: event.id,
          sourceName: title.trim(),
        });
      }
    }

    onSave({
      ...event,
      title: title.trim(),
      description: description.trim() || undefined,
      date,
      endDate: isMultiDay && endDate ? endDate : undefined,
      time: time || undefined,
      endTime: isMultiDay && endTime ? endTime : undefined,
      duration: !isMultiDay && time ? parseInt(duration) || 60 : undefined,
      location: location.trim() || undefined,
      recurring: isRecurring ? {
        enabled: true,
        intervalDays: parseInt(recurringDays) || 7
      } : undefined,
    });

    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
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
                onCheckedChange={(checked) => {
                  setIsMultiDay(checked as boolean);
                  if (checked) {
                    setDuration(''); // Disable duration for multi-day
                  }
                }}
              />
              <Label htmlFor="multiDay" className="cursor-pointer">
                Multi-day event
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

            {isMultiDay ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="time">Start Time (optional)</Label>
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time (optional)</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            ) : (
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
            )}

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
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}