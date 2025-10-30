import { CalendarEvent } from '@/types/event';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clock, Calendar as CalendarIcon, Edit, MapPin, Repeat } from 'lucide-react';

interface EventDetailsViewDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const EventDetailsViewDialog = ({ event, open, onClose, onEdit }: EventDetailsViewDialogProps) => {
  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Event Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-muted-foreground text-sm">Event Title</Label>
            <h2 className="text-xl font-semibold mt-1">{event.title}</h2>
          </div>

          {event.description && (
            <div>
              <Label className="text-muted-foreground text-sm">Description</Label>
              <p className="mt-1 text-sm whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          <div>
            <Label className="text-muted-foreground text-sm flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              Date
            </Label>
            <p className="mt-1">{new Date(event.date).toLocaleDateString('en-GB', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>

          {event.time && (
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Time
              </Label>
              <p className="mt-1 font-semibold">{event.time}</p>
            </div>
          )}

          {event.duration && (
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Duration
              </Label>
              <p className="mt-1">{event.duration} minutes</p>
            </div>
          )}

          {event.location && (
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </Label>
              <p className="mt-1">{event.location}</p>
            </div>
          )}

          {event.recurring?.enabled && (
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                Recurring
              </Label>
              <p className="mt-1">Every {event.recurring.intervalDays} {event.recurring.intervalDays === 1 ? 'day' : 'days'}</p>
            </div>
          )}

          <div className="pt-4 flex gap-2 justify-end">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailsViewDialog;
