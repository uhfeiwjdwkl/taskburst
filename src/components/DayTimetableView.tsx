import { CalendarEvent } from '@/types/event';
import { Timetable } from '@/types/timetable';
import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DayTimetableViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventClick: (event: CalendarEvent) => void;
}

export function DayTimetableView({ events, selectedDate, onEventClick }: DayTimetableViewProps) {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load timetables
  useEffect(() => {
    const saved = localStorage.getItem('timetables');
    if (saved) {
      const parsed = JSON.parse(saved) as Timetable[];
      const active = parsed.filter(t => !t.deletedAt);
      setTimetables(active);
      if (active.length > 0 && !selectedTimetableId) {
        setSelectedTimetableId(active[0].id);
      }
    }
  }, []);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const selectedTimetable = timetables.find(t => t.id === selectedTimetableId);
  
  // Generate time slots from 6 AM to 11 PM
  const hours = Array.from({ length: 18 }, (_, i) => i + 6);
  
  // Filter events that have a time set
  const timedEvents = events.filter(e => e.time);

  // Get timetable cells for the selected day
  const getTimetableCells = () => {
    if (!selectedTimetable) return [];
    
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    const colIndex = selectedTimetable.columns.indexOf(dayName);
    
    if (colIndex === -1) return [];

    // Calculate which week for fortnightly timetables
    let currentWeek: 1 | 2 = 1;
    if (selectedTimetable.type === 'fortnightly' && selectedTimetable.fortnightStartDate) {
      const startDate = new Date(selectedTimetable.fortnightStartDate);
      const daysDiff = Math.floor((selectedDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const weeksDiff = Math.floor(daysDiff / 7);
      currentWeek = (weeksDiff % 2) === 0 ? 1 : 2;
    }

    const cells = [];
    for (let rowIndex = 0; rowIndex < selectedTimetable.rows.length; rowIndex++) {
      const cellKey = `${rowIndex}-${colIndex}`;
      const cell = selectedTimetable.cells[cellKey];
      if (cell && !cell.hidden && (!cell.week || cell.week === currentWeek)) {
        const timeSlot = selectedTimetable.rows[rowIndex];
        cells.push({
          ...cell,
          timeSlot,
        });
      }
    }
    return cells;
  };

  const timetableCells = getTimetableCells();

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

  // Calculate current time bar position
  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 6 * 60; // 6 AM
    const endMinutes = 23 * 60; // 11 PM
    
    if (totalMinutes < startMinutes || totalMinutes >= endMinutes) {
      return null;
    }

    const top = ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
    return top;
  };

  const currentTimeTop = getCurrentTimePosition();

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Day Schedule
        </h3>
        {timetables.length > 0 && (
          <Select value={selectedTimetableId || undefined} onValueChange={setSelectedTimetableId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select timetable" />
            </SelectTrigger>
            <SelectContent>
              {timetables.map((tt) => (
                <SelectItem key={tt.id} value={tt.id}>
                  {tt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
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

        {/* Timetable cells (background, low opacity) */}
        <div className="absolute inset-0 pl-16">
          {timetableCells.map((cell, idx) => {
            const position = getEventPosition(cell.timeSlot.startTime, cell.timeSlot.duration);
            if (!position) return null;

            return (
              <div
                key={idx}
                className="absolute left-0 right-0 mx-2 rounded-md p-2 border opacity-30 overflow-hidden pointer-events-none"
                style={{
                  top: `${position.top}%`,
                  height: `${Math.max(position.height, 3)}%`,
                  backgroundColor: cell.color || '#e5e7eb',
                }}
              >
                <div className="text-[10px] font-medium truncate">
                  {cell.fields.filter(f => f).join(' • ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar events overlay (on top) */}
        <div className="absolute inset-0 pl-16">
          {timedEvents.map((event) => {
            const position = event.time ? getEventPosition(event.time, event.duration) : null;
            if (!position) return null;

            return (
              <div
                key={event.id}
                className="absolute left-0 right-0 mx-2 rounded-md p-2 bg-primary/20 border-l-4 border-primary overflow-hidden cursor-pointer hover:bg-primary/30 transition-colors"
                style={{
                  top: `${position.top}%`,
                  height: `${Math.max(position.height, 3)}%`,
                }}
                onClick={() => onEventClick(event)}
              >
                <div className="text-[10px] font-semibold truncate">{event.title}</div>
              </div>
            );
          })}
        </div>

        {/* Current time bar */}
        {currentTimeTop !== null && (
          <div
            className="absolute left-16 right-0 h-0.5 bg-red-500 z-10"
            style={{ top: `${currentTimeTop}%` }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
          </div>
        )}
      </div>
    </Card>
  );
}
