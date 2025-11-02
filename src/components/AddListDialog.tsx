import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { List, ListItem } from '@/types/list';


interface AddListDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (list: Omit<List, 'id' | 'createdAt' | 'order'>) => void;
}

export const AddListDialog = ({ open, onClose, onAdd }: AddListDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateTime, setDueDateTime] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ListItem[]>([]);
  const [currentInput, setCurrentInput] = useState('');

  const handleAddItem = () => {
    if (!currentInput.trim()) return;
    
    const newItem: ListItem = {
      id: Date.now().toString(),
      title: currentInput.trim(),
      priority: 3,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    
    setItems([...items, newItem]);
    setCurrentInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItem();
    }
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<ListItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (!title.trim() || items.length === 0) return;

    const newList: Omit<List, 'id' | 'createdAt' | 'order'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDateTime: dueDateTime || undefined,
      favorite: false,
      notes: notes.trim() || undefined,
      items,
    };

    onAdd(newList);
    
    // Reset form
    setTitle('');
    setDescription('');
    setDueDateTime('');
    setNotes('');
    setItems([]);
    setCurrentInput('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New List</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">List Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter list title"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
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
              placeholder="Add notes..."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="itemInput">Add Items</Label>
            <Input
              id="itemInput"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type item and press Enter"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter to add each item
            </p>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <Label>Items ({items.length})</Label>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 border rounded">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => moveItem(index, index - 1)}
                      >
                        ↑
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === items.length - 1}
                        onClick={() => moveItem(index, index + 1)}
                      >
                        ↓
                      </Button>
                    </div>
                    <Input
                      value={item.title}
                      onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || items.length === 0}>
              Create List
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
