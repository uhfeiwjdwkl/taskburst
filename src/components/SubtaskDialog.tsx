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

interface SubtaskDialogProps {
  subtask: Subtask | null;
  open: boolean;
  onClose: () => void;
  onSave: (subtask: Subtask) => void;
  isNew?: boolean;
  taskId: string;
  availableGridIndices?: number[]; // Available progress grid indices to link to
}

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
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | undefined>(undefined);
  const [priority, setPriority] = useState<number | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [linkedToProgressGrid, setLinkedToProgressGrid] = useState(false);
  const [progressGridIndex, setProgressGridIndex] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (subtask) {
      setTitle(subtask.title);
      setDescription(subtask.description || '');
      setEstimatedMinutes(subtask.estimatedMinutes);
      setPriority(subtask.priority);
      setDueDate(subtask.dueDate || '');
      setScheduledTime(subtask.scheduledTime || '');
      setLinkedToProgressGrid(subtask.linkedToProgressGrid);
      setProgressGridIndex(subtask.progressGridIndex);
    } else {
      setTitle('');
      setDescription('');
      setEstimatedMinutes(undefined);
      setPriority(undefined);
      setDueDate('');
      setScheduledTime('');
      setLinkedToProgressGrid(false);
      setProgressGridIndex(undefined);
    }
  }, [subtask, open]);

  const handleSave = () => {
    if (!title.trim()) return;

    const savedSubtask: Subtask = {
      id: subtask?.id || Date.now().toString(),
      taskId,
      title: title.trim(),
      description: description.trim() || undefined,
      estimatedMinutes: estimatedMinutes || undefined,
      priority: priority || undefined,
      dueDate: dueDate || undefined,
      scheduledTime: scheduledTime || undefined,
      completed: subtask?.completed || false,
      linkedToProgressGrid,
      progressGridIndex: linkedToProgressGrid ? progressGridIndex : undefined,
      createdAt: subtask?.createdAt || new Date().toISOString(),
    };

    onSave(savedSubtask);
    onClose();
  };

  const priorityLabels = ['None', 'Low', 'Medium', 'High', 'Urgent', 'Critical'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Add Subtask' : 'Edit Subtask'}</DialogTitle>
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
              <Label htmlFor="scheduledTime">Scheduled Time</Label>
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
            <Label htmlFor="estimatedMinutes">Estimated Time (minutes)</Label>
            <Input
              id="estimatedMinutes"
              type="number"
              value={estimatedMinutes || ''}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || undefined)}
              placeholder="Optional"
              className="mt-1"
              min="0"
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
