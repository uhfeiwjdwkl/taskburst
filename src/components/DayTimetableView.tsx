import { CalendarEvent } from '@/types/event';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';

interface DayTimetableViewProps {
  events: CalendarEvent[];
}

export function DayTimetableView({ events }: DayTimetableViewProps) {
  // Generate time slots from 6 AM to 11 PM
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  
  // Filter events that have a time set
  const timedEvents = events.filter(e => e.time);

  // Calculate position for each event
  const getEventPosition = (time: string, duration: number = 60) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 6 * 60; // 6 AM
    const endMinutes = 23 * 60; // 11 PM
    
    if (totalMinutes < startMinutes || totalMinutes >= endMinutes) {
      return null;
    }

    const top = ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
    const height = (duration / ((endMinutes - startMinutes))) * 100;
    
    return { top, height };
  };

  const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour} ${period}`;
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Day Schedule
      </h3>
      <div className="relative h-[600px] overflow-auto">
        {/* Time grid */}
        <div className="absolute inset-0">
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-t border-border flex items-start"
              style={{ top: `${((hour - 6) / 17) * 100}%` }}
            >
              <span className="text-xs text-muted-foreground w-16 -mt-2 bg-background">
                {formatTime(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Events overlay */}
        <div className="absolute inset-0 pl-16">
          {timedEvents.map((event) => {
            const position = event.time ? getEventPosition(event.time, event.duration) : null;
            if (!position) return null;

            return (
              <div
                key={event.id}
                className="absolute left-0 right-0 mx-2 rounded-md p-2 bg-primary/20 border-l-4 border-primary overflow-hidden"
                style={{
                  top: `${position.top}%`,
                  height: `${Math.max(position.height, 3)}%`,
                }}
              >
                <div className="text-xs font-semibold truncate">{event.title}</div>
                <div className="text-xs text-muted-foreground">
                  {event.time} {event.duration && `(${event.duration}m)`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
