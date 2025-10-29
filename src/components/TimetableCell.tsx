import { useState, useEffect } from "react";
import { TimetableCell as TimetableCellType } from "@/types/timetable";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface TimetableCellProps {
  cell?: TimetableCellType;
  fieldsPerCell: 1 | 2 | 3;
  rowIndex: number;
  colIndex: number;
  onUpdate: (rowIndex: number, colIndex: number, fields: string[]) => void;
  onColorUpdate: (rowIndex: number, colIndex: number, color: string | undefined) => void;
  showCurrentTime?: boolean;
  currentTimeProgress?: number;
  isEditing: boolean;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
];

export function TimetableCell({
  cell,
  fieldsPerCell,
  rowIndex,
  colIndex,
  onUpdate,
  onColorUpdate,
  showCurrentTime,
  currentTimeProgress,
  isEditing
}: TimetableCellProps) {
  const [fields, setFields] = useState<string[]>(
    cell?.fields || Array(fieldsPerCell).fill('')
  );

  useEffect(() => {
    setFields(cell?.fields || Array(fieldsPerCell).fill(''));
  }, [cell, fieldsPerCell]);

  const handleFieldChange = (index: number, value: string) => {
    const newFields = [...fields];
    newFields[index] = value;
    setFields(newFields);
  };

  const handleBlur = () => {
    onUpdate(rowIndex, colIndex, fields);
  };

  const rowSpan = cell?.rowSpan || 1;
  const colSpan = cell?.colSpan || 1;

  return (
    <td
      rowSpan={rowSpan}
      colSpan={colSpan}
      className="border relative p-0"
      style={{
        backgroundColor: cell?.color || 'transparent',
        minHeight: '60px'
      }}
    >
      {showCurrentTime && currentTimeProgress !== undefined && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
          style={{ top: `${currentTimeProgress * 100}%` }}
        >
          <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
        </div>
      )}
      
      <div className="p-1 space-y-1 min-h-[60px]">
        {Array.from({ length: fieldsPerCell }).map((_, index) => (
          isEditing ? (
            <Input
              key={index}
              value={fields[index] || ''}
              onChange={(e) => handleFieldChange(index, e.target.value)}
              onBlur={handleBlur}
              className="h-7 text-xs bg-background/50"
              placeholder={`Field ${index + 1}`}
            />
          ) : (
            <div key={index} className="h-7 px-2 py-1 text-xs flex items-center">
              {fields[index] || ''}
            </div>
          )
        ))}
        
        {isEditing && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-6 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                Color
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-6 gap-1">
                <button
                  className="w-8 h-8 rounded border-2 border-input flex items-center justify-center text-xs"
                  onClick={() => onColorUpdate(rowIndex, colIndex, undefined)}
                >
                  ✕
                </button>
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: color }}
                    onClick={() => onColorUpdate(rowIndex, colIndex, color)}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </td>
  );
}
