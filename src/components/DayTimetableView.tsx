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
import TimetableCellDetailsDialog from '@/components/TimetableCellDetailsDialog';

interface DayTimetableViewProps {
  events: CalendarEvent[];
  selectedDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onTimetableUpdate?: () => void;
}

export function DayTimetableView({ events, selectedDate, onEventClick, onTimetableUpdate }: DayTimetableViewProps) {
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [selectedTimetableId, setSelectedTimetableId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCell, setSelectedCell] = useState<any>(null);
  const [cellDetailsOpen, setCellDetailsOpen] = useState(false);
  const [cellRowCol, setCellRowCol] = useState<{ row: number; col: number } | null>(null);

  // Load timetables
  useEffect(() => {
    loadTimetables();
  }, []);

  const loadTimetables = () => {
    const saved = localStorage.getItem('timetables');
    if (saved) {
      const parsed = JSON.parse(saved) as Timetable[];
      const active = parsed.filter(t => !t.deletedAt);
      setTimetables(active);
      if (active.length > 0 && !selectedTimetableId) {
        setSelectedTimetableId(active[0].id);
      }
    } else {
      // Create default 24-hour timetable
      const defaultTimetable: Timetable = {
        id: 'default-24hr',
        name: 'Default 24-Hour Schedule',
        favorite: false,
        type: 'weekly',
        mode: 'rigid',
        rows: Array.from({ length: 24 }, (_, i) => ({
          id: `hour-${i}`,
          label: `${i}:00`,
          startTime: `${String(i).padStart(2, '0')}:00`,
          duration: 60,
        })),
        columns: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        fieldsPerCell: 1,
        cells: {},
        colorKey: {},
        createdAt: new Date().toISOString(),
      };
      setTimetables([defaultTimetable]);
      setSelectedTimetableId('default-24hr');
    }
  };

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
          rowIndex,
          colIndex,
        });
      }
    }
    return cells;
  };

  const handleSaveCell = (updatedCell: any) => {
    if (!selectedTimetable || !cellRowCol) return;

    const cellKey = `${cellRowCol.row}-${cellRowCol.col}`;
    const updatedTimetable = {
      ...selectedTimetable,
      cells: {
        ...selectedTimetable.cells,
        [cellKey]: {
          ...selectedTimetable.cells[cellKey],
          ...updatedCell,
        },
      },
    };

    const allTimetables = timetables.map(t => 
      t.id === selectedTimetable.id ? updatedTimetable : t
    );
    
    localStorage.setItem('timetables', JSON.stringify(allTimetables));
    loadTimetables();
    
    if (onTimetableUpdate) {
      onTimetableUpdate();
    }
  };

  const timetableCells = getTimetableCells();

  // Calculate overlapping events and their positions
  const getEventPositions = () => {
    const positions: Array<{
      event: CalendarEvent;
      top: number;
      height: number;
      column: number;
      totalColumns: number;
    }> = [];

    const startMinutes = 6 * 60; // 6 AM
    const endMinutes = 23 * 60; // 11 PM

    // Sort events by start time
    const sortedEvents = [...timedEvents].sort((a, b) => {
      const [aHours, aMinutes] = (a.time || '').split(':').map(Number);
      const [bHours, bMinutes] = (b.time || '').split(':').map(Number);
      return (aHours * 60 + aMinutes) - (bHours * 60 + bMinutes);
    });

    // Track concurrent events
    const concurrentGroups: CalendarEvent[][] = [];

    sortedEvents.forEach((event) => {
      if (!event.time) return;
      
      const [hours, minutes] = event.time.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes;
      const eventEnd = totalMinutes + (event.duration || 60);

      if (totalMinutes < startMinutes || totalMinutes >= endMinutes) return;

      // Find which group this event belongs to
      let groupIndex = -1;
      for (let i = 0; i < concurrentGroups.length; i++) {
        const group = concurrentGroups[i];
        const hasOverlap = group.some(existingEvent => {
          const [eHours, eMinutes] = (existingEvent.time || '').split(':').map(Number);
          const eStart = eHours * 60 + eMinutes;
          const eEnd = eStart + (existingEvent.duration || 60);
          return totalMinutes < eEnd && eventEnd > eStart;
        });
        if (hasOverlap) {
          groupIndex = i;
          break;
        }
      }

      if (groupIndex === -1) {
        concurrentGroups.push([event]);
      } else {
        concurrentGroups[groupIndex].push(event);
      }
    });

    // Calculate positions
    concurrentGroups.forEach(group => {
      const totalColumns = group.length;
      group.forEach((event, columnIndex) => {
        const [hours, minutes] = (event.time || '').split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;
        
        const top = ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
        const height = ((event.duration || 60) / (endMinutes - startMinutes)) * 100;

        positions.push({
          event,
          top,
          height,
          column: columnIndex,
          totalColumns
        });
      });
    });

    return positions;
  };

  const eventPositions = getEventPositions();

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
        {/* Time labels on the left edge */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10">
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full"
              style={{ top: `${((hour - 6) / 17) * 100}%` }}
            >
              <span className="text-xs text-muted-foreground bg-background px-1 block text-right">
                {formatTime(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Time grid lines */}
        <div className="absolute inset-0 pl-16">
          {hours.map((hour) => (
            <div
              key={hour}
              className="absolute w-full border-t border-border"
              style={{ top: `${((hour - 6) / 17) * 100}%`, left: 0 }}
            />
          ))}
        </div>

        {/* Timetable cells (background, low opacity) */}
        <div className="absolute inset-0 pl-16">
          {timetableCells.map((cell, idx) => {
            const [hours, minutes] = cell.timeSlot.startTime.split(':').map(Number);
            const totalMinutes = hours * 60 + minutes;
            const startMinutes = 6 * 60;
            const endMinutes = 23 * 60;
            
            if (totalMinutes < startMinutes || totalMinutes >= endMinutes) return null;

            const top = ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
            const height = (cell.timeSlot.duration / (endMinutes - startMinutes)) * 100;

            return (
              <div
                key={idx}
                className="absolute rounded-md p-2 border opacity-30 overflow-hidden cursor-pointer hover:opacity-50 transition-opacity"
                style={{
                  top: `${top}%`,
                  height: `${Math.max(height, 3)}%`,
                  left: '68px',
                  backgroundColor: cell.color || '#e5e7eb',
                }}
                onClick={() => {
                  setSelectedCell(cell);
                  setCellRowCol({ row: cell.rowIndex, col: cell.colIndex });
                  setCellDetailsOpen(true);
                }}
              >
                <div className="text-xs font-medium truncate">
                  {cell.fields.filter(f => f).join(' • ')}
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar events overlay (on top) */}
        <div className="absolute inset-0 pl-16">
          {eventPositions.map(({ event, top, height, column, totalColumns }) => {
            const widthPercent = 100 / totalColumns;
            const leftPercent = (column * widthPercent);

            const adjustedLeft = 68 + (leftPercent * (100 - 68) / 100);
            const adjustedWidth = (widthPercent * (100 - 68) / 100) - 0.5;

            return (
              <div
                key={event.id}
                className="absolute rounded-md p-2 bg-primary/20 border-l-4 border-primary overflow-hidden cursor-pointer hover:bg-primary/30 transition-colors z-[1]"
                style={{
                  top: `${top}%`,
                  height: `${Math.max(height, 3)}%`,
                  left: `${adjustedLeft}px`,
                  width: `calc(${adjustedWidth}% - 4px)`,
                }}
                onClick={() => onEventClick(event)}
              >
                <div className="text-xs font-semibold truncate">{event.title}</div>
              </div>
            );
          })}
        </div>

        {/* Current time bar */}
        {currentTimeTop !== null && (
          <div
            className="absolute left-0 right-0 h-0.5 bg-red-500 z-10"
            style={{ top: `${currentTimeTop}%`, marginLeft: '64px' }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
          </div>
        )}
      </div>
      <TimetableCellDetailsDialog
        cell={selectedCell}
        open={cellDetailsOpen}
        onClose={() => {
          setCellDetailsOpen(false);
          setSelectedCell(null);
          setCellRowCol(null);
        }}
        onSave={handleSaveCell}
      />
    </Card>
  );
}
