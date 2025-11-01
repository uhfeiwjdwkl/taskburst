import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ListItem } from '@/types/list';
import { Trash2, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ListItemDetailsDialogProps {
  item: ListItem | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (item: ListItem) => void;
  onDelete: (itemId: string) => void;
}

export const ListItemDetailsDialog = ({ item, open, onClose, onUpdate, onDelete }: ListItemDetailsDialogProps) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(3);
  const [dateTime, setDateTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setPriority(item.priority);
      setDateTime(item.dateTime || '');
      setNotes(item.notes || '');
    }
  }, [item]);

  if (!item) return null;

  const handleSave = () => {
    const updatedItem: ListItem = {
      ...item,
      title: title.trim(),
      priority,
      dateTime: dateTime || undefined,
      notes: notes.trim() || undefined,
    };
    onUpdate(updatedItem);
    onClose();
  };

  const handleComplete = () => {
    onUpdate({ ...item, completed: !item.completed });
    onClose();
  };

  const handleDeleteClick = () => {
    onDelete(item.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Item Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((p) => (
                <Button
                  key={p}
                  variant={priority === p ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPriority(p)}
                >
                  {p}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="dateTime">Date & Time (Optional)</Label>
            <Input
              id="dateTime"
              type="datetime-local"
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant={item.completed ? 'outline' : 'default'}
                size="sm"
                onClick={handleComplete}
              >
                <Archive className="h-4 w-4 mr-2" />
                {item.completed ? 'Mark Incomplete' : 'Mark Complete'}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
