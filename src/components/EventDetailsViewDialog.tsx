import { useAppSettings } from '@/hooks/useAppSettings';
import { eventTimingLabel, eventDuration, clockMinutes, timelinePixelsPerMinute } from '@/lib/eventTiming';
import { deleteStoredEntity } from '@/lib/itemDeletion';
import { ConfirmDelete } from './ConfirmDeleteButton';
import { CalendarEvent } from '@/types/event';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, Edit, Trash2, MapPin, Repeat, CalendarRange } from 'lucide-react';
import { ExportEventButton } from '@/components/ExportEventButton';
import { differenceInDays, format, parseISO, eachDayOfInterval, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

interface EventDetailsViewDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

const EventDetailsViewDialog = ({ event, open, onClose, onEdit, onDuplicate, onDelete }: EventDetailsViewDialogProps) => {
  const settings = useAppSettings();
  const pixelsPerMinute = timelinePixelsPerMinute(settings.calendarReadableMinutes);
  if (!event) return null;

  const isMultiDay = !!event.endDate;
  const durationInDays = isMultiDay 
    ? differenceInDays(parseISO(event.endDate || event.date), parseISO(event.date)) + 1
    : 1;

  const formatTime12Hour = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Generate mini calendar for multi-day events
  const eventStartDate = parseISO(event.date);
  const eventEndDate = event.endDate ? parseISO(event.endDate) : eventStartDate;
  const calendarStart = startOfWeek(eventStartDate, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(eventEndDate, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const duration = eventDuration(event) ?? 0;
  const startMinutes = event.time ? clockMinutes(event.time) : 0;
  const before = event.travelTimeStart || 0;
  const after = event.travelTimeEnd || 0;
  const viewStart = Math.max(0, Math.floor((startMinutes - before) / 60) * 60);
  const viewEnd = Math.min(1440, Math.ceil((startMinutes + Math.max(5, duration) + after) / 60) * 60);
  const timeSlots = Array.from({ length: Math.max(1, (viewEnd - viewStart) / 60) + 1 }, (_, i) => viewStart / 60 + i);

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

          {isMultiDay && (
            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
              <CalendarRange className="h-3 w-3" />
              Multi-day event ({durationInDays} days)
            </Badge>
          )}

          {event.description && (
            <div>
              <Label className="text-muted-foreground text-sm">Description</Label>
              <div
                className="mt-1 text-sm prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(event.description) }}
              />
            </div>
          )}

          {/* Visual Calendar/Timetable Snapshot */}
          <div>
            <Label className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
              {isMultiDay ? <CalendarRange className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
              {isMultiDay ? 'Calendar View' : 'Time View'}
            </Label>
            
            {isMultiDay ? (
              // Mini calendar for multi-day events
              <div className="border rounded-lg p-2 bg-muted/30">
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div key={i} className="text-xs text-muted-foreground font-medium py-1">{d}</div>
                  ))}
                  {calendarDays.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isInEvent = dateStr >= event.date && dateStr <= (event.endDate || event.date);
                    const isStart = dateStr === event.date;
                    const isEnd = dateStr === event.endDate;
                    
                    return (
                      <div
                        key={i}
                        className={`text-xs py-1.5 rounded-sm ${
                          isInEvent 
                            ? `bg-primary text-primary-foreground ${isStart ? 'rounded-l-md' : ''} ${isEnd ? 'rounded-r-md' : ''}`
                            : 'text-muted-foreground'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : event.time ? (
              <div className="border rounded-lg bg-muted/30 max-h-72 overflow-y-auto p-2">
                <div className="relative" style={{ height: `${Math.max(60, viewEnd - viewStart) * pixelsPerMinute}px` }}>
                  {timeSlots.map(hour => <div key={hour} className="absolute inset-x-0 border-t text-xs text-muted-foreground" style={{ top: `${(hour * 60 - viewStart) * pixelsPerMinute}px` }}>{hour.toString().padStart(2, '0')}:00</div>)}
                  {before > 0 && <div className="absolute left-14 right-0 bg-primary/10 border-l-2 border-primary border-dotted opacity-40" style={{ top: `${(startMinutes - before - viewStart) * pixelsPerMinute}px`, height: `${before * pixelsPerMinute}px` }} />}
                  <div className="absolute left-14 right-0 bg-primary/20 border-l-2 border-primary px-2 text-xs overflow-hidden" style={{ top: `${(startMinutes - viewStart) * pixelsPerMinute}px`, height: `${Math.max(5, duration) * pixelsPerMinute}px` }}>{event.title}</div>
                  {after > 0 && <div className="absolute left-14 right-0 bg-primary/10 border-l-2 border-primary border-dotted opacity-40" style={{ top: `${(startMinutes + duration - viewStart) * pixelsPerMinute}px`, height: `${after * pixelsPerMinute}px` }} />}
                </div>
              </div>
            ) : null}
          </div>

          {isMultiDay ? (
            <div className="space-y-3">
              <div>
                <Label className="text-muted-foreground text-sm flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Start Date
                </Label>
                <p className="mt-1">{format(parseISO(event.date), 'EEEE, d MMMM yyyy')}</p>
                {event.time && (
                  <p className="text-sm text-muted-foreground">at {formatTime12Hour(event.time)}</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground text-sm flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  End Date
                </Label>
                <p className="mt-1">{format(parseISO(event.endDate || event.date), 'EEEE, d MMMM yyyy')}</p>
                {event.endTime && (
                  <p className="text-sm text-muted-foreground">at {formatTime12Hour(event.endTime)}</p>
                )}
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-muted-foreground text-sm flex items-center gap-1">
                  <CalendarIcon className="h-3 w-3" />
                  Date
                </Label>
                <p className="mt-1">{format(parseISO(event.date), 'EEEE, d MMMM yyyy')}</p>
              </div>

              {event.time && (
                <div>
                  <Label className="text-muted-foreground text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Time
                  </Label>
                  <p className="mt-1 font-semibold break-words">{eventTimingLabel(event)}</p>
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
            </>
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

          {isMultiDay && event.time && <p className="text-sm break-words">{eventTimingLabel(event)}</p>}

          {event.recurring?.enabled && (
            <div>
              <Label className="text-muted-foreground text-sm flex items-center gap-1">
                <Repeat className="h-3 w-3" />
                Recurring
              </Label>
              <p className="mt-1">
                Every {event.recurring.intervalDays} {event.recurring.intervalDays === 1 ? 'day' : 'days'}
                {event.recurring.endDate && ` · until ${event.recurring.endDate}`}
              </p>
            </div>
          )}

          <div className="pt-4 flex flex-wrap gap-2 justify-end">
            <ConfirmDelete title="Delete this event?" description="This event will be moved to recently deleted." onConfirm={() => { if (onDelete) onDelete(); else deleteStoredEntity('calendarEvents', event.id); onClose(); }} trigger={open => <Button type="button" variant="destructive" onClick={open}><Trash2 className="h-4 w-4 mr-2" />Delete</Button>} />
            <ExportEventButton event={event} />
            {onDuplicate && (
              <Button variant="outline" onClick={onDuplicate}>
                Duplicate
              </Button>
            )}
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