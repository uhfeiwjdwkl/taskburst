import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/event';
import { Timetable, TimetableCell } from '@/types/timetable';
import { Card } from '@/components/ui/card';
import { Clock, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CurrentEvent {
  type: 'calendar' | 'timetable';
  title: string;
  id: string;
  timetableId?: string;
  rowIndex?: number;
  colIndex?: number;
}

export const CurrentEventDisplay = () => {
  const [currentEvent, setCurrentEvent] = useState<CurrentEvent | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const updateCurrentEvent = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const today = now.toISOString().split('T')[0];

      // Check calendar events
      const eventsData = localStorage.getItem('calendarEvents');
      if (eventsData) {
        const events: CalendarEvent[] = JSON.parse(eventsData);
        const activeEvent = events.find(event => {
          if (event.deletedAt) return false;
          if (event.date !== today) return false;
          if (!event.time || !event.duration) return false;

          const [hours, minutes] = event.time.split(':').map(Number);
          const eventStart = hours * 60 + minutes;
          const eventEnd = eventStart + event.duration;

          return currentTime >= eventStart && currentTime < eventEnd;
        });

        if (activeEvent) {
          setCurrentEvent({
            type: 'calendar',
            title: activeEvent.title,
            id: activeEvent.id,
          });
          return;
        }
      }

      // Check timetable events
      const timetablesData = localStorage.getItem('timetables');
      if (timetablesData) {
        const timetables: Timetable[] = JSON.parse(timetablesData);
        const activeTimetables = timetables.filter(t => !t.deletedAt && t.favorite);

        for (const timetable of activeTimetables) {
          // Check each row for current time
          for (let rowIndex = 0; rowIndex < timetable.rows.length; rowIndex++) {
            const row = timetable.rows[rowIndex];
            if (!row.startTime || !row.duration) continue;

            const [hours, minutes] = row.startTime.split(':').map(Number);
            const rowStart = hours * 60 + minutes;
            const rowEnd = rowStart + row.duration;

            if (currentTime >= rowStart && currentTime < rowEnd) {
              // Check each column
              for (let colIndex = 0; colIndex < timetable.columns.length; colIndex++) {
                const cellKey = `${rowIndex}-${colIndex}`;
                const cell = timetable.cells[cellKey];
                
                if (cell && cell.fields.some(f => f)) {
                  // For fortnightly, check if this cell is for current week
                  if (timetable.type === 'fortnightly' && timetable.fortnightStartDate) {
                    const startDate = new Date(timetable.fortnightStartDate);
                    const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const weekNumber = (Math.floor(daysDiff / 7) % 2) + 1;
                    if (cell.week && cell.week !== weekNumber) {
                      continue;
                    }
                  }
                  
                  setCurrentEvent({
                    type: 'timetable',
                    title: cell.fields.filter(f => f).join(' • '),
                    id: timetable.id,
                    timetableId: timetable.id,
                    rowIndex,
                    colIndex,
                  });
                  return;
                }
              }
            }
          }
        }
      }

      setCurrentEvent(null);
    };

    updateCurrentEvent();
    const interval = setInterval(updateCurrentEvent, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!currentEvent) return null;

  const handleClick = () => {
    if (currentEvent.type === 'calendar') {
      navigate('/calendar');
    } else if (currentEvent.type === 'timetable') {
      navigate('/timetable');
    }
  };

  return (
    <Card 
      className="p-4 mb-4 cursor-pointer hover:shadow-lg transition-all border-primary/20 bg-primary/5"
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        {currentEvent.type === 'calendar' ? (
          <Calendar className="h-5 w-5 text-primary" />
        ) : (
          <Clock className="h-5 w-5 text-primary" />
        )}
        <div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Current {currentEvent.type === 'calendar' ? 'Event' : 'Timetable Block'}
          </div>
          <div className="font-semibold text-foreground">{currentEvent.title}</div>
        </div>
      </div>
    </Card>
  );
};
