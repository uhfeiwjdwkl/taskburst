import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Clock } from "lucide-react";
import { TimeSlot } from "@/types/timetable";
import { toast } from "sonner";

interface TimetableRowColEditorProps {
  rows: TimeSlot[];
  columns: string[];
  onUpdateRows: (rows: TimeSlot[]) => void;
  onUpdateColumns: (columns: string[]) => void;
}

export function TimetableRowColEditor({ rows, columns, onUpdateRows, onUpdateColumns }: TimetableRowColEditorProps) {
  const [newTimeLabel, setNewTimeLabel] = useState("");
  const [newTimeStart, setNewTimeStart] = useState("09:00");
  const [newTimeDuration, setNewTimeDuration] = useState(60);
  const [newColumnName, setNewColumnName] = useState("");

  const handleAddRow = () => {
    if (!newTimeLabel.trim()) {
      toast.error("Please enter a time slot label");
      return;
    }
    const newRow: TimeSlot = {
      id: `timeslot-${Date.now()}`,
      label: newTimeLabel.trim(),
      startTime: newTimeStart,
      duration: newTimeDuration
    };
    onUpdateRows([...rows, newRow]);
    setNewTimeLabel("");
    setNewTimeStart("09:00");
    setNewTimeDuration(60);
    toast.success("Time slot added");
  };

  const handleRemoveRow = (id: string) => {
    onUpdateRows(rows.filter(r => r.id !== id));
    toast.success("Time slot removed");
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) {
      toast.error("Please enter a day name");
      return;
    }
    if (columns.includes(newColumnName.trim())) {
      toast.error("This day already exists");
      return;
    }
    onUpdateColumns([...columns, newColumnName.trim()]);
    setNewColumnName("");
    toast.success("Day added");
  };

  const handleRemoveColumn = (name: string) => {
    onUpdateColumns(columns.filter(c => c !== name));
    toast.success("Day removed");
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Slots (Rows)
        </h3>
        <div className="space-y-2 mb-4">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <p className="font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">
                  {row.startTime} • {row.duration} minutes
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemoveRow(row.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Input
            placeholder="Label (e.g., Period 1)"
            value={newTimeLabel}
            onChange={(e) => setNewTimeLabel(e.target.value)}
            className="flex-1 min-w-[150px]"
          />
          <Input
            type="time"
            value={newTimeStart}
            onChange={(e) => setNewTimeStart(e.target.value)}
            className="w-32"
          />
          <Input
            type="number"
            placeholder="Duration"
            value={newTimeDuration}
            onChange={(e) => setNewTimeDuration(parseInt(e.target.value) || 60)}
            className="w-24"
            min="5"
            step="5"
          />
          <Button onClick={handleAddRow} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Days (Columns)</h3>
        <div className="space-y-2 mb-4">
          {columns.map((col) => (
            <div key={col} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <p className="font-medium">{col}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleRemoveColumn(col)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Day name (e.g., Monday)"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleAddColumn} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </Card>
    </div>
  );
}