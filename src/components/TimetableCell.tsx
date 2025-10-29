import { useState, useEffect } from "react";
import { TimetableCell as TimetableCellType } from "@/types/timetable";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimetableCellProps {
  cell?: TimetableCellType;
  fieldsPerCell: 1 | 2 | 3;
  rowIndex: number;
  colIndex: number;
  onUpdate: (rowIndex: number, colIndex: number, fields: string[]) => void;
  onColorUpdate: (rowIndex: number, colIndex: number, color: string | undefined) => void;
  onFieldCountUpdate: (rowIndex: number, colIndex: number, count: 1 | 2 | 3) => void;
  onSelect: (rowIndex: number, colIndex: number) => void;
  isSelected: boolean;
  showCurrentTime?: boolean;
  currentTimeProgress?: number;
  isEditing: boolean;
  focusedColor?: string;
  colorKey: Record<string, string>;
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
  onFieldCountUpdate,
  onSelect,
  isSelected,
  showCurrentTime,
  currentTimeProgress,
  isEditing,
  focusedColor,
  colorKey
}: TimetableCellProps) {
  const currentFieldCount = cell?.fieldsPerCell || fieldsPerCell;
  const [fields, setFields] = useState<string[]>(
    cell?.fields || Array(currentFieldCount).fill('')
  );

  useEffect(() => {
    const count = cell?.fieldsPerCell || fieldsPerCell;
    setFields(cell?.fields || Array(count).fill(''));
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

  const shouldDesaturate = focusedColor && cell?.color && cell.color !== focusedColor;

  const handleCellClick = (e: React.MouseEvent) => {
    if (isEditing && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSelect(rowIndex, colIndex);
    }
  };

  const handleFieldCountChange = (newCount: string) => {
    const count = parseInt(newCount) as 1 | 2 | 3;
    onFieldCountUpdate(rowIndex, colIndex, count);
  };

  // Auto font size based on content length
  const getAutoFontSize = (text: string, fieldCount: number) => {
    const length = text.length;
    if (length === 0) return 'text-xs';
    
    // Adjust for multiple fields - smaller base size
    const baseSize = fieldCount > 1 ? 10 : 12;
    
    if (length > 40) return `text-[${Math.max(baseSize - 4, 8)}px]`;
    if (length > 30) return `text-[${Math.max(baseSize - 2, 9)}px]`;
    if (length > 20) return `text-[${baseSize}px]`;
    if (length > 10) return `text-[${baseSize + 1}px]`;
    return `text-[${baseSize + 2}px]`;
  };

  return (
    <td
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={`border relative p-0 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary ring-inset' : ''}`}
      style={{
        backgroundColor: cell?.color || 'transparent',
        minHeight: '60px',
        filter: shouldDesaturate ? 'saturate(0.2) opacity(0.5)' : 'none'
      }}
      onClick={handleCellClick}
    >
      {showCurrentTime && currentTimeProgress !== undefined && (
        <div
          className="absolute left-0 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
          style={{ top: `${currentTimeProgress * 100}%` }}
        >
          <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
        </div>
      )}
      
      <div className="p-1 space-y-1 min-h-[60px] flex flex-col justify-center items-center">
        {Array.from({ length: currentFieldCount }).map((_, index) => (
          isEditing ? (
            <Input
              key={index}
              value={fields[index] || ''}
              onChange={(e) => handleFieldChange(index, e.target.value)}
              onBlur={handleBlur}
              className="h-7 text-xs bg-background/50 text-center w-full"
              placeholder={`Field ${index + 1}`}
            />
          ) : (
            <div 
              key={index} 
              className={`h-7 px-2 py-1 flex items-center justify-center w-full font-medium ${getAutoFontSize(fields[index] || '', currentFieldCount)}`}
              style={{ lineHeight: '1.2' }}
            >
              {fields[index] || ''}
            </div>
          )
        ))}
        
        {isEditing && (
          <div className="flex gap-1 w-full">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 h-6 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  Color
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" onClick={(e) => e.stopPropagation()}>
                <div className="space-y-2">
                  {Object.keys(colorKey).length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Color Key</p>
                      <div className="space-y-1">
                        {Object.entries(colorKey).map(([color, label]) => (
                          <button
                            key={color}
                            className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-accent text-left"
                            onClick={() => onColorUpdate(rowIndex, colIndex, color)}
                          >
                            <div
                              className="w-6 h-6 rounded border flex-shrink-0"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm">{label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="border-t pt-2 mt-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">Other Colors</p>
                      </div>
                    </>
                  )}
                  <div className="grid grid-cols-6 gap-1">
                    <button
                      className="w-8 h-8 rounded border-2 border-input flex items-center justify-center text-xs"
                      onClick={() => onColorUpdate(rowIndex, colIndex, undefined)}
                      title="Clear color"
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
                </div>
              </PopoverContent>
            </Popover>
            <Select value={currentFieldCount.toString()} onValueChange={handleFieldCountChange}>
              <SelectTrigger 
                className="h-6 text-xs w-12 px-1" 
                onClick={(e) => e.stopPropagation()}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent onClick={(e) => e.stopPropagation()}>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </td>
  );
}
