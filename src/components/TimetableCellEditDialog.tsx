import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface TimetableCellEditDialogProps {
  cell: {
    fields: string[];
    color?: string;
    timeSlot: {
      startTime: string;
      duration: number;
    };
  } | null;
  open: boolean;
  onClose: () => void;
  onSave: (updatedCell: any) => void;
}

const TimetableCellEditDialog = ({ cell, open, onClose, onSave }: TimetableCellEditDialogProps) => {
  const [fields, setFields] = useState<string[]>([]);
  const [color, setColor] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState(60);

  useEffect(() => {
    if (cell) {
      setFields([...cell.fields]);
      setColor(cell.color || '');
      setStartTime(cell.timeSlot.startTime);
      setDuration(cell.timeSlot.duration);
    }
  }, [cell]);

  if (!cell) return null;

  const handleSave = () => {
    onSave({
      fields,
      color,
      timeSlot: {
        startTime,
        duration,
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Timetable Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {fields.map((field, idx) => (
            <div key={idx}>
              <Label>Field {idx + 1}</Label>
              <Input
                value={field}
                onChange={(e) => {
                  const updated = [...fields];
                  updated[idx] = e.target.value;
                  setFields(updated);
                }}
                className="mt-1"
              />
            </div>
          ))}

          <div>
            <Label>Start Time</Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
              className="mt-1"
              min="1"
            />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimetableCellEditDialog;
