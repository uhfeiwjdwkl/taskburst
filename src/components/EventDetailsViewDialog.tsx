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
import { Clock, Calendar as CalendarIcon, Edit, MapPin, Repeat, CalendarRange } from 'lucide-react';
import { ExportEventButton } from '@/components/ExportEventButton';
import { differenceInDays, format, parseISO, eachDayOfInterval, addDays, startOfWeek, endOfWeek } from 'date-fns';

interface EventDetailsViewDialogProps {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const EventDetailsViewDialog = ({ event, open, onClose, onEdit }: EventDetailsViewDialogProps) => {
  if (!event) return null;

  const isMultiDay = !!event.endDate;
  const durationInDays = isMultiDay 
    ? differenceInDays(parseISO(event.endDate!), parseISO(event.date)) + 1
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

  // Generate time slots for single-day timetable view
  const generateTimeSlots = () => {
    if (!event.time) return [];
    const [startHour] = event.time.split(':').map(Number);
    const duration = event.duration || 60;
    const endHour = Math.min(startHour + Math.ceil(duration / 60) + 1, 24);
    const startDisplay = Math.max(startHour - 1, 0);
    return Array.from({ length: endHour - startDisplay + 1 }, (_, i) => startDisplay + i);
  };

  const timeSlots = generateTimeSlots();

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
              <p className="mt-1 text-sm whitespace-pre-wrap">{event.description}</p>
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
              // Mini timetable for single-day events
              <div className="border rounded-lg p-2 bg-muted/30 relative">
                <div className="space-y-0">
                  {timeSlots.map((hour) => {
                    const [eventHour, eventMin] = event.time!.split(':').map(Number);
                    const duration = event.duration || 60;
                    const isEventStart = hour === eventHour;
                    const eventEndHour = eventHour + Math.floor((eventMin + duration) / 60);
                    const isInEvent = hour >= eventHour && hour < eventEndHour;
                    
                    return (
                      <div key={hour} className="flex items-center gap-2 h-6">
                        <span className="text-xs text-muted-foreground w-12">
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </span>
                        <div className={`flex-1 h-full border-t border-border relative ${
                          isInEvent ? 'bg-primary/20' : ''
                        }`}>
                          {isEventStart && (
                            <div 
                              className="absolute left-0 right-0 bg-primary text-primary-foreground text-xs px-1 rounded z-10 truncate"
                              style={{ 
                                top: `${(eventMin / 60) * 100}%`,
                                height: `${Math.min(duration / 60, eventEndHour - hour) * 100}%`,
                                minHeight: '20px'
                              }}
                            >
                              {event.title}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                <p className="mt-1">{format(parseISO(event.endDate!), 'EEEE, d MMMM yyyy')}</p>
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
                  <p className="mt-1 font-semibold">{formatTime12Hour(event.time)}</p>
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
            <ExportEventButton event={event} />
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