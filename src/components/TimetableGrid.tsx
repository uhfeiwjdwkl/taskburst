import { useState, useEffect, useRef } from "react";
import { Timetable } from "@/types/timetable";
import { TimetableCell as TimetableCellComponent } from "@/components/TimetableCell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface TimetableGridProps {
  timetable: Timetable;
  currentWeek: 1 | 2;
  onUpdate: (timetable: Timetable) => void;
  isEditing: boolean;
  focusedColor?: string;
}

export function TimetableGrid({ timetable, currentWeek, onUpdate, isEditing, focusedColor }: TimetableGridProps) {
  const [currentTimePosition, setCurrentTimePosition] = useState<{ row: number; progress: number } | null>(null);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
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

  const handleCellSelect = (rowIndex: number, colIndex: number) => {
    if (!isEditing) return;
    const key = getCellKey(rowIndex, colIndex);
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const handleMergeCells = () => {
    if (selectedCells.size < 2) return;
    
    const cells = Array.from(selectedCells).map(key => {
      const [row, col] = key.split('-').map(Number);
      return { row, col, key };
    });
    
    // Find bounds
    const minRow = Math.min(...cells.map(c => c.row));
    const maxRow = Math.max(...cells.map(c => c.row));
    const minCol = Math.min(...cells.map(c => c.col));
    const maxCol = Math.max(...cells.map(c => c.col));
    
    // Verify it's a rectangular selection
    const expectedCells = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    if (selectedCells.size !== expectedCells) {
      toast.error("Please select a rectangular area to merge");
      return;
    }
    
    const anchorKey = getCellKey(minRow, minCol);
    const anchorCell = timetable.cells[anchorKey] || {
      rowIndex: minRow,
      colIndex: minCol,
      fields: Array(timetable.fieldsPerCell).fill('')
    };
    
    const updatedCells = { ...timetable.cells };
    
    // Set the anchor cell with span
    updatedCells[anchorKey] = {
      ...anchorCell,
      rowSpan: maxRow - minRow + 1,
      colSpan: maxCol - minCol + 1
    };
    
    // Hide other cells
    cells.forEach(({ key, row, col }) => {
      if (key !== anchorKey) {
        updatedCells[key] = {
          ...(updatedCells[key] || { rowIndex: row, colIndex: col, fields: Array(timetable.fieldsPerCell).fill('') }),
          hidden: true
        };
      }
    });
    
    onUpdate({ ...timetable, cells: updatedCells });
    setSelectedCells(new Set());
  };

  const handleUnmergeCells = () => {
    if (selectedCells.size === 0) return;
    
    const updatedCells = { ...timetable.cells };
    
    selectedCells.forEach(key => {
      const cell = updatedCells[key];
      if (cell?.rowSpan && cell.rowSpan > 1 || cell?.colSpan && cell.colSpan > 1) {
        const { rowSpan = 1, colSpan = 1 } = cell;
        
        // Reset the main cell
        updatedCells[key] = {
          ...cell,
          rowSpan: 1,
          colSpan: 1
        };
        
        // Unhide the other cells
        for (let r = 0; r < rowSpan; r++) {
          for (let c = 0; c < colSpan; c++) {
            const unhideKey = getCellKey(cell.rowIndex + r, cell.colIndex + c);
            if (unhideKey !== key && updatedCells[unhideKey]) {
              updatedCells[unhideKey] = {
                ...updatedCells[unhideKey],
                hidden: false
              };
            }
          }
        }
      }
    });
    
    onUpdate({ ...timetable, cells: updatedCells });
    setSelectedCells(new Set());
  };

  return (
    <div className="space-y-4">
      {isEditing && selectedCells.size > 0 && (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleMergeCells} disabled={selectedCells.size < 2}>
            Merge Cells ({selectedCells.size})
          </Button>
          <Button size="sm" variant="outline" onClick={handleUnmergeCells}>
            Unmerge Selected
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedCells(new Set())}>
            Clear Selection
          </Button>
        </div>
      )}
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
                      onSelect={handleCellSelect}
                      isSelected={selectedCells.has(key)}
                      showCurrentTime={isCurrentTime}
                      currentTimeProgress={currentTimePosition?.progress}
                      isEditing={isEditing}
                      focusedColor={focusedColor}
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
