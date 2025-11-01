import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { List } from '@/types/list';

interface EditListDialogProps {
  list: List | null;
  open: boolean;
  onClose: () => void;
  onSave: (list: List) => void;
}

export const EditListDialog = ({ list, open, onClose, onSave }: EditListDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [listText, setListText] = useState('');

  useEffect(() => {
    if (list) {
      setTitle(list.title);
      setDescription(list.description || '');
      setDueDateTime(list.dueDateTime || '');
      setNotes(list.notes || '');
      setListText(list.items.map(item => item.title).join('\n'));
    }
  }, [list]);

  if (!list) return null;

  const handleSave = () => {
    if (!title.trim()) return;

    // Parse updated list items
    const lines = listText.split('\n').filter(line => line.trim());
    const updatedItems = lines.map((line, index) => {
      const cleanedLine = line.replace(/^[•\-*]\s*/, '').trim();
      const existingItem = list.items.find(item => item.title === cleanedLine);
      
      return existingItem || {
        id: `${Date.now()}-${index}`,
        title: cleanedLine,
        priority: 3,
        completed: false,
        createdAt: new Date().toISOString(),
      };
    });

    const updatedList: List = {
      ...list,
      title: title.trim(),
      description: description.trim() || undefined,
      dueDateTime: dueDateTime || undefined,
      notes: notes.trim() || undefined,
      items: updatedItems,
    };

    onSave(updatedList);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit List</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">List Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="dueDateTime">Due Date & Time (Optional)</Label>
            <Input
              id="dueDateTime"
              type="datetime-local"
              value={dueDateTime}
              onChange={(e) => setDueDateTime(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="listText">Edit List Items (One per line)</Label>
            <Textarea
              id="listText"
              value={listText}
              onChange={(e) => setListText(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!title.trim()}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
