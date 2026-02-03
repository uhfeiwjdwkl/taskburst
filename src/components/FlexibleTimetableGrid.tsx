import { useState, useEffect } from 'react';
import { Timetable, FlexibleEvent } from '@/types/timetable';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';
import { FlexibleEventDetailsDialog } from './FlexibleEventDetailsDialog';

interface FlexibleTimetableGridProps {
  timetable: Timetable;
  isEditing?: boolean;
  currentWeek?: 1 | 2;
  onUpdateTimetable?: (timetable: Timetable) => void;
}

// Storage key for flexible events
const FLEXIBLE_EVENTS_KEY = 'flexibleTimetableEvents';

export function FlexibleTimetableGrid({ 
  timetable, 
  isEditing = false,
  currentWeek = 1,
  onUpdateTimetable
}: FlexibleTimetableGridProps) {
  const [events, setEvents] = useState<FlexibleEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<FlexibleEvent | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEventDay, setNewEventDay] = useState<number | null>(null);

  // Form state for adding new events
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('09:00');
  const [newEventEndTime, setNewEventEndTime] = useState('10:00');

  // Load events from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(FLEXIBLE_EVENTS_KEY);
    if (saved) {
      const allEvents = JSON.parse(saved) as FlexibleEvent[];
      setEvents(allEvents.filter(e => e.timetableId === timetable.id));
    }
  }, [timetable.id]);

  // Save events to localStorage
  const saveEvents = (newEvents: FlexibleEvent[]) => {
    const saved = localStorage.getItem(FLEXIBLE_EVENTS_KEY);
    const allEvents = saved ? JSON.parse(saved) as FlexibleEvent[] : [];
    const otherEvents = allEvents.filter(e => e.timetableId !== timetable.id);
    localStorage.setItem(FLEXIBLE_EVENTS_KEY, JSON.stringify([...otherEvents, ...newEvents]));
    setEvents(newEvents);
  };

  // Calculate time range
  const startTime = timetable.flexStartTime || '06:00';
  const endTime = timetable.flexEndTime || '22:00';
  const interval = timetable.flexInterval || 60;
  const timeFormat = timetable.flexTimeFormat || '12h';

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  const startMinutesOfDay = startHour * 60 + startMin;

  // Format time based on setting
  const formatTime = (time: string) => {
    if (timeFormat === '24h') return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Generate time markers
  const timeMarkers: string[] = [];
  for (let m = startHour * 60 + startMin; m <= endHour * 60 + endMin; m += interval) {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    timeMarkers.push(`${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`);
  }

  // Calculate current time position
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentPosition = ((currentMinutes - startMinutesOfDay) / totalMinutes) * 100;
  const showCurrentTime = currentPosition >= 0 && currentPosition <= 100;

  // Get position and height for an event
  const getEventStyle = (event: FlexibleEvent) => {
    const [eventStartH, eventStartM] = event.startTime.split(':').map(Number);
    const [eventEndH, eventEndM] = event.endTime.split(':').map(Number);
    const eventStartMins = eventStartH * 60 + eventStartM;
    const eventEndMins = eventEndH * 60 + eventEndM;
    
    const top = ((eventStartMins - startMinutesOfDay) / totalMinutes) * 100;
    const height = ((eventEndMins - eventStartMins) / totalMinutes) * 100;
    
    return {
      top: `${Math.max(0, top)}%`,
      height: `${Math.max(2, height)}%`,
    };
  };

  const handleAddEvent = (dayIndex: number) => {
    setNewEventDay(dayIndex);
    setNewEventTitle('');
    setNewEventStartTime('09:00');
    setNewEventEndTime('10:00');
    setAddDialogOpen(true);
  };

  const handleEventClick = (event: FlexibleEvent) => {
    setSelectedEvent(event);
    setDetailsDialogOpen(true);
  };

  const handleSaveNewEvent = () => {
    if (!newEventTitle.trim() || newEventDay === null) return;

    const newEvent: FlexibleEvent = {
      id: Date.now().toString(),
      timetableId: timetable.id,
      dayIndex: newEventDay,
      startTime: newEventStartTime,
      endTime: newEventEndTime,
      title: newEventTitle.trim(),
      fields: [],
      week: timetable.type === 'fortnightly' ? currentWeek : undefined,
    };
    
    saveEvents([...events, newEvent]);
    setAddDialogOpen(false);
  };

  const handleSaveEvent = (updatedEvent: FlexibleEvent) => {
    const updated = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
    saveEvents(updated);
    setDetailsDialogOpen(false);
    setSelectedEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    saveEvents(events.filter(e => e.id !== eventId));
    setDetailsDialogOpen(false);
    setSelectedEvent(null);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex">
        {/* Time column */}
        <div className="w-16 flex-shrink-0 border-r bg-muted/30">
          <div className="h-10 border-b" /> {/* Header spacer */}
          <div className="relative" style={{ height: `${timeMarkers.length * 40}px` }}>
            {timeMarkers.map((time, i) => (
              <div
                key={time}
                className="absolute left-0 right-0 text-xs text-muted-foreground px-2"
                style={{ top: `${(i / (timeMarkers.length - 1)) * 100}%`, transform: 'translateY(-50%)' }}
              >
                {formatTime(time)}
              </div>
            ))}
          </div>
        </div>

        {/* Day columns */}
        <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${timetable.columns.length}, 1fr)` }}>
          {/* Day headers */}
          {timetable.columns.map((day, dayIndex) => (
            <div key={day} className="h-10 border-b border-r flex items-center justify-center font-medium text-sm bg-muted/30">
              {day.slice(0, 3)}
            </div>
          ))}

          {/* Day content */}
          {timetable.columns.map((day, dayIndex) => {
            const dayEvents = events.filter(e => 
              e.dayIndex === dayIndex && 
              (timetable.type !== 'fortnightly' || !e.week || e.week === currentWeek)
            );

            return (
              <div
                key={`content-${dayIndex}`}
                className="relative border-r"
                style={{ height: `${timeMarkers.length * 40}px` }}
              >
                {/* Time grid lines */}
                {timeMarkers.map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-dashed border-border/50"
                    style={{ top: `${(i / (timeMarkers.length - 1)) * 100}%` }}
                  />
                ))}

                {/* Current time indicator */}
                {showCurrentTime && dayIndex === new Date().getDay() - 1 && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
                    style={{ top: `${currentPosition}%` }}
                  >
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
                  </div>
                )}

                {/* Events */}
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className={cn(
                      "absolute left-1 right-1 rounded-md px-2 py-1 cursor-pointer text-xs overflow-hidden",
                      "hover:ring-2 hover:ring-ring transition-all"
                    )}
                    style={{
                      ...getEventStyle(event),
                      backgroundColor: event.color ? `${event.color}30` : 'hsl(var(--primary) / 0.2)',
                      borderLeft: `3px solid ${event.color || 'hsl(var(--primary))'}`,
                    }}
                  >
                    <div className="font-medium truncate" style={{ color: event.color || 'hsl(var(--primary))' }}>
                      {event.title}
                    </div>
                    <div className="text-muted-foreground text-[10px]">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </div>
                  </div>
                ))}

                {/* Add event button (when editing) */}
                {isEditing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 h-6 text-xs opacity-50 hover:opacity-100"
                    onClick={() => handleAddEvent(dayIndex)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Dialog */}
      <FlexibleEventDetailsDialog
        event={selectedEvent}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        timeFormat={timeFormat}
      />

      {/* Add Event Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-sm" showClose={false}>
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Add Event</DialogTitle>
            <Button variant="ghost" size="sm" onClick={() => setAddDialogOpen(false)} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newEventTitle}
                onChange={(e) => setNewEventTitle(e.target.value)}
                placeholder="Event title"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newEventStartTime}
                  onChange={(e) => setNewEventStartTime(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newEventEndTime}
                  onChange={(e) => setNewEventEndTime(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNewEvent}>
              Add Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
