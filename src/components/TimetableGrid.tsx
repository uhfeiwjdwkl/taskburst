import { useState, useEffect, useRef } from "react";
import { Timetable, TimetableCell } from "@/types/timetable";
import { TimetableCell as TimetableCellComponent } from "@/components/TimetableCell";
import { Button } from "@/components/ui/button";
import { Merge, Split } from "lucide-react";
import { toast } from "sonner";

interface TimetableGridProps {
  timetable: Timetable;
  currentWeek: 1 | 2;
  onUpdate: (timetable: Timetable) => void;
}

export function TimetableGrid({ timetable, currentWeek, onUpdate }: TimetableGridProps) {
  const [selectedCells, setSelectedCells] = useState<string[]>([]);
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
        const [endHour, endMin] = slot.endTime.split(':').map(Number);
        const slotStart = startHour * 60 + startMin;
        const slotEnd = endHour * 60 + endMin;

        if (currentTime >= slotStart && currentTime < slotEnd) {
          const progress = (currentTime - slotStart) / (slotEnd - slotStart);
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
    
    const updatedCell: TimetableCell = {
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

    const updatedCell: TimetableCell = { ...existingCell, color };

    onUpdate({
      ...timetable,
      cells: { ...timetable.cells, [key]: updatedCell }
    });
  };

  const handleCellSelect = (rowIndex: number, colIndex: number, isShiftKey: boolean) => {
    const key = getCellKey(rowIndex, colIndex);
    
    if (isShiftKey) {
      setSelectedCells(prev => 
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
    } else {
      setSelectedCells([key]);
    }
  };

  const handleMergeCells = () => {
    if (selectedCells.length < 2) {
      toast.error("Select at least 2 cells to merge");
      return;
    }

    const positions = selectedCells.map(key => {
      const [row, col] = key.split('-').map(Number);
      return { row, col };
    });

    const minRow = Math.min(...positions.map(p => p.row));
    const maxRow = Math.max(...positions.map(p => p.row));
    const minCol = Math.min(...positions.map(p => p.col));
    const maxCol = Math.max(...positions.map(p => p.col));

    // Check if selection forms a rectangle
    const expectedCells = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    if (selectedCells.length !== expectedCells) {
      toast.error("Can only merge rectangular selections");
      return;
    }

    const newCells = { ...timetable.cells };
    const mainKey = getCellKey(minRow, minCol);
    const mainCell = newCells[mainKey] || {
      rowIndex: minRow,
      colIndex: minCol,
      fields: Array(timetable.fieldsPerCell).fill('')
    };

    // Update main cell with span
    newCells[mainKey] = {
      ...mainCell,
      rowSpan: maxRow - minRow + 1,
      colSpan: maxCol - minCol + 1
    };

    // Mark other cells as hidden
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        if (r !== minRow || c !== minCol) {
          const key = getCellKey(r, c);
          newCells[key] = {
            rowIndex: r,
            colIndex: c,
            fields: Array(timetable.fieldsPerCell).fill(''),
            hidden: true
          };
        }
      }
    }

    onUpdate({ ...timetable, cells: newCells });
    setSelectedCells([]);
    toast.success("Cells merged");
  };

  const handleUnmergeCells = () => {
    if (selectedCells.length !== 1) {
      toast.error("Select a single merged cell to unmerge");
      return;
    }

    const [rowIndex, colIndex] = selectedCells[0].split('-').map(Number);
    const cell = timetable.cells[selectedCells[0]];

    if (!cell || (!cell.rowSpan && !cell.colSpan)) {
      toast.error("Selected cell is not merged");
      return;
    }

    const newCells = { ...timetable.cells };
    const rowSpan = cell.rowSpan || 1;
    const colSpan = cell.colSpan || 1;

    // Remove span from main cell
    newCells[selectedCells[0]] = {
      ...cell,
      rowSpan: undefined,
      colSpan: undefined
    };

    // Remove hidden flag from other cells
    for (let r = rowIndex; r < rowIndex + rowSpan; r++) {
      for (let c = colIndex; c < colIndex + colSpan; c++) {
        if (r !== rowIndex || c !== colIndex) {
          const key = getCellKey(r, c);
          if (newCells[key]) {
            delete newCells[key].hidden;
          }
        }
      }
    }

    onUpdate({ ...timetable, cells: newCells });
    setSelectedCells([]);
    toast.success("Cells unmerged");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleMergeCells}
          disabled={selectedCells.length < 2}
        >
          <Merge className="h-4 w-4 mr-1" />
          Merge
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleUnmergeCells}
          disabled={selectedCells.length !== 1}
        >
          <Split className="h-4 w-4 mr-1" />
          Unmerge
        </Button>
        <span className="text-sm text-muted-foreground self-center ml-2">
          Hold Shift to select multiple cells
        </span>
      </div>

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

                  const isSelected = selectedCells.includes(key);
                  const isCurrentTime = currentTimePosition?.row === rowIndex;

                  return (
                    <TimetableCellComponent
                      key={key}
                      cell={cell}
                      fieldsPerCell={timetable.fieldsPerCell}
                      rowIndex={rowIndex}
                      colIndex={colIndex}
                      isSelected={isSelected}
                      onUpdate={handleCellUpdate}
                      onColorUpdate={handleCellColorUpdate}
                      onSelect={handleCellSelect}
                      showCurrentTime={isCurrentTime}
                      currentTimeProgress={currentTimePosition?.progress}
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
