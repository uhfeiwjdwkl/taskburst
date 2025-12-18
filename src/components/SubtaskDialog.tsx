import { useState, useEffect } from 'react';
import { Subtask } from '@/types/subtask';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

interface SubtaskDialogProps {
  subtask: Subtask | null;
  open: boolean;
  onClose: () => void;
  onSave: (subtask: Subtask) => void;
  isNew?: boolean;
  taskId: string;
  availableGridIndices?: number[]; // Available progress grid indices to link to
}

const SUBTASK_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
];

export const SubtaskDialog = ({ 
  subtask, 
  open, 
  onClose, 
  onSave, 
  isNew = false,
  taskId,
  availableGridIndices = []
}: SubtaskDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [abbreviation, setAbbreviation] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(60);
  const [priority, setPriority] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [linkedToProgressGrid, setLinkedToProgressGrid] = useState(false);
  const [progressGridIndex, setProgressGridIndex] = useState<number | undefined>(undefined);
  const [color, setColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (subtask) {
      setTitle(subtask.title);
      setDescription(subtask.description || '');
      setAbbreviation(subtask.abbreviation || '');
      setEstimatedMinutes(subtask.estimatedMinutes || 60);
      setPriority(subtask.priority);
      setDueDate(subtask.dueDate || '');
      setScheduledTime(subtask.scheduledTime || '');
      setLinkedToProgressGrid(subtask.linkedToProgressGrid);
      setProgressGridIndex(subtask.progressGridIndex);
      setColor(subtask.color);
    } else {
      setTitle('');
      setDescription('');
      setAbbreviation('');
      setEstimatedMinutes(60);
      setPriority(undefined);
      setDueDate('');
      setScheduledTime('');
      setLinkedToProgressGrid(false);
      setProgressGridIndex(undefined);
      setColor(undefined);
    }
  }, [subtask, open]);

  const handleSave = () => {
    if (!title.trim()) return;

    const savedSubtask: Subtask = {
      id: subtask?.id || Date.now().toString(),
      taskId,
      title: title.trim(),
      description: description.trim() || undefined,
      abbreviation: abbreviation.trim() || undefined,
      estimatedMinutes: estimatedMinutes || undefined,
      priority: priority || undefined,
      dueDate: dueDate || undefined,
      scheduledTime: scheduledTime || undefined,
      completed: subtask?.completed || false,
      linkedToProgressGrid,
      progressGridIndex: linkedToProgressGrid ? progressGridIndex : undefined,
      createdAt: subtask?.createdAt || new Date().toISOString(),
      color: color || undefined,
    };

    onSave(savedSubtask);
    onClose();
  };

  const priorityLabels = ['None', 'Low', 'Medium', 'High', 'Urgent', 'Critical'];

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{isNew ? 'Add Subtask' : 'Edit Subtask'}</DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Subtask title"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="abbreviation">Abbreviation (for grid)</Label>
              <Input
                id="abbreviation"
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value.slice(0, 3))}
                placeholder="e.g. ABC"
                maxLength={3}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                <button
                  onClick={() => setColor(undefined)}
                  className={`w-6 h-6 rounded border-2 ${!color ? 'border-primary' : 'border-transparent'} bg-muted`}
                  title="Default"
                />
                {SUBTASK_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded border-2 ${color === c ? 'border-primary' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dueDate">Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="scheduledTime">Time</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="estimatedMinutes">Duration (minutes)</Label>
            <Input
              id="estimatedMinutes"
              type="number"
              value={estimatedMinutes || ''}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || undefined)}
              placeholder="60"
              className="mt-1"
              min="5"
              step="5"
            />
          </div>

          <div>
            <Label>Priority (Optional): {priority ? priorityLabels[priority] : 'None'}</Label>
            <Slider
              value={[priority || 0]}
              onValueChange={([value]) => setPriority(value || undefined)}
              min={0}
              max={5}
              step={1}
              className="mt-2"
            />
          </div>

          {availableGridIndices.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="linkToGrid"
                  checked={linkedToProgressGrid}
                  onCheckedChange={(checked) => {
                    setLinkedToProgressGrid(checked as boolean);
                    if (!checked) setProgressGridIndex(undefined);
                  }}
                />
                <Label htmlFor="linkToGrid" className="cursor-pointer">
                  Link to progress grid box
                </Label>
              </div>
              
              {linkedToProgressGrid && (
                <div className="pl-6">
                  <Label>Select Grid Box</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableGridIndices.map((index) => (
                      <Button
                        key={index}
                        type="button"
                        variant={progressGridIndex === index ? "default" : "outline"}
                        size="sm"
                        onClick={() => setProgressGridIndex(index)}
                        className="w-10 h-10"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {isNew ? 'Add Subtask' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
