import { useState, useEffect, useRef } from "react";
import { Timetable } from "@/types/timetable";
import { TimetableCell as TimetableCellComponent } from "@/components/TimetableCell";

interface TimetableGridProps {
  timetable: Timetable;
  currentWeek: 1 | 2;
  onUpdate: (timetable: Timetable) => void;
  isEditing: boolean;
}

export function TimetableGrid({ timetable, currentWeek, onUpdate, isEditing }: TimetableGridProps) {
  const [currentTimePosition, setCurrentTimePosition] = useState<{ row: number; progress: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateCurrentTime = () => {
      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

      // Check if we're in the current week for fortnightly timetables
      if (timetable.type === 'fortnightly' && timetable.fortnightStartDate) {
        const startDate = new Date(timetable.fortnightStartDate);
        const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const weeksDiff = Math.floor(daysDiff / 7);
        const calculatedWeek = (weeksDiff % 2) === 0 ? 1 : 2;
        
        if (calculatedWeek !== currentWeek) {
          setCurrentTimePosition(null);
          return;
        }
      }

      // Find which row the current time falls in
      for (let i = 0; i < timetable.rows.length; i++) {
        const slot = timetable.rows[i];
        const [startHour, startMin] = slot.startTime.split(':').map(Number);
        const slotStart = startHour * 60 + startMin;
        const slotEnd = slotStart + slot.duration;

        if (currentTime >= slotStart && currentTime < slotEnd) {
          const progress = (currentTime - slotStart) / slot.duration;
          setCurrentTimePosition({ row: i, progress });
          return;
        }
      }
      setCurrentTimePosition(null);
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [timetable, currentWeek]);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const handleCellUpdate = (rowIndex: number, colIndex: number, fields: string[]) => {
    const key = getCellKey(rowIndex, colIndex);
    const existingCell = timetable.cells[key];
    
    const updatedCell = {
      rowIndex,
      colIndex,
      fields,
      color: existingCell?.color,
      rowSpan: existingCell?.rowSpan,
      colSpan: existingCell?.colSpan,
    };

    onUpdate({
      ...timetable,
      cells: { ...timetable.cells, [key]: updatedCell }
    });
  };

  const handleCellColorUpdate = (rowIndex: number, colIndex: number, color: string | undefined) => {
    const key = getCellKey(rowIndex, colIndex);
    const existingCell = timetable.cells[key] || {
      rowIndex,
      colIndex,
      fields: Array(timetable.fieldsPerCell).fill('')
    };

    const updatedCell = { ...existingCell, color };

    onUpdate({
      ...timetable,
      cells: { ...timetable.cells, [key]: updatedCell }
    });
  };

  return (
    <div className="space-y-4">
      <div ref={gridRef} className="border rounded-lg overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border bg-muted p-2 min-w-[100px] sticky left-0 z-10">Time</th>
              {timetable.columns.map((day, idx) => (
                <th key={idx} className="border bg-muted p-2 min-w-[120px]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timetable.rows.map((timeSlot, rowIndex) => (
              <tr key={timeSlot.id} className="relative">
                <td className="border bg-muted p-2 font-medium text-sm sticky left-0 z-10">
                  {timeSlot.label}
                </td>
                {timetable.columns.map((_, colIndex) => {
                  const key = getCellKey(rowIndex, colIndex);
                  const cell = timetable.cells[key];
                  
                  if (cell?.hidden) {
                    return null;
                  }

                  const isCurrentTime = currentTimePosition?.row === rowIndex;

                  return (
                    <TimetableCellComponent
                      key={key}
                      cell={cell}
                      fieldsPerCell={timetable.fieldsPerCell}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      onUpdate={handleCellUpdate}
                      onColorUpdate={handleCellColorUpdate}
                      showCurrentTime={isCurrentTime}
                      currentTimeProgress={currentTimePosition?.progress}
                      isEditing={isEditing}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
