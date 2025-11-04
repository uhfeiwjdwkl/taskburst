import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { List, ListItem } from '@/types/list';
import { Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [items, setItems] = useState<ListItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    if (list) {
      setTitle(list.title);
      setDescription(list.description || '');
      setDueDateTime(list.dueDateTime || '');
      setNotes(list.notes || '');
      setItems(list.items);
      setSelectedItems(new Set());
      setPasteText('');
    }
  }, [list]);

  if (!list) return null;

  const handlePasteItems = () => {
    if (!pasteText.trim()) return;
    
    const lines = pasteText.split('\n').filter(line => line.trim());
    const newItems = lines.map((line, index) => {
      const cleanedLine = line.replace(/^[•\-*]\s*/, '').trim();
      return {
        id: `${Date.now()}-${index}`,
        title: cleanedLine,
        priority: 3,
        completed: false,
        createdAt: new Date().toISOString(),
      };
    });
    
    setItems([...items, ...newItems]);
    setPasteText('');
  };

  const handleUpdateItem = (id: string, updates: Partial<ListItem>) => {
    setItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [moved] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, moved);
    setItems(newItems);
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleBulkDelete = () => {
    setItems(items.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };

  const handleBulkSetPriority = (priority: number) => {
    setItems(items.map(item => 
      selectedItems.has(item.id) ? { ...item, priority } : item
    ));
  };

  const handleBulkToggleComplete = () => {
    setItems(items.map(item => 
      selectedItems.has(item.id) ? { ...item, completed: !item.completed } : item
    ));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    const updatedList: List = {
      ...list,
      title: title.trim(),
      description: description.trim() || undefined,
      dueDateTime: dueDateTime || undefined,
      notes: notes.trim() || undefined,
      items,
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
            <Label>Paste Items (Optional)</Label>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste text here (one item per line)..."
              rows={3}
              className="font-mono text-sm"
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={handlePasteItems}
              disabled={!pasteText.trim()}
              className="mt-2"
            >
              Add Pasted Items
            </Button>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Items ({items.length})</Label>
              {items.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectAll}
                  >
                    {selectedItems.size === items.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  {selectedItems.size > 0 && (
                    <>
                      <Select onValueChange={(value) => handleBulkSetPriority(parseInt(value))}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Priority 1</SelectItem>
                          <SelectItem value="2">Priority 2</SelectItem>
                          <SelectItem value="3">Priority 3</SelectItem>
                          <SelectItem value="4">Priority 4</SelectItem>
                          <SelectItem value="5">Priority 5</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleBulkToggleComplete}
                      >
                        Toggle Complete
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {items.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto border rounded-md p-2">
                {items.map((item, index) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 border rounded bg-background">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => toggleSelectItem(item.id)}
                    />
                    <div className="flex flex-col gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === 0}
                        onClick={() => moveItem(index, index - 1)}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={index === items.length - 1}
                        onClick={() => moveItem(index, index + 1)}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={item.title}
                      onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                      className="flex-1"
                    />
                    <Select
                      value={item.priority.toString()}
                      onValueChange={(value) => handleUpdateItem(item.id, { priority: parseInt(value) })}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">P1</SelectItem>
                        <SelectItem value="2">P2</SelectItem>
                        <SelectItem value="3">P3</SelectItem>
                        <SelectItem value="4">P4</SelectItem>
                        <SelectItem value="5">P5</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No items yet. Paste items above or add them individually.
              </p>
            )}
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
