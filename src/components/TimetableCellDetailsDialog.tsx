import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface TimetableCellDetailsDialogProps {
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
}

const TimetableCellDetailsDialog = ({ cell, open, onClose }: TimetableCellDetailsDialogProps) => {
  if (!cell) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Timetable Entry Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="text-muted-foreground text-sm">Title</Label>
            <h2 className="text-xl font-semibold mt-1">{cell.fields.filter(f => f).join(' • ')}</h2>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Time
            </Label>
            <p className="mt-1 font-semibold">{cell.timeSlot.startTime}</p>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Duration
            </Label>
            <p className="mt-1">{cell.timeSlot.duration} minutes</p>
          </div>

          {cell.color && (
            <div>
              <Label className="text-muted-foreground text-sm">Color</Label>
              <div className="mt-1 flex items-center gap-2">
                <div 
                  className="h-6 w-6 rounded border"
                  style={{ backgroundColor: cell.color }}
                />
                <span className="text-sm">{cell.color}</span>
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TimetableCellDetailsDialog;
