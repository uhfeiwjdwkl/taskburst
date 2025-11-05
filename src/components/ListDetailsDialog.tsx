import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { List, ListItem } from '@/types/list';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Star, Edit, Trash2, Archive, Info, Plus } from 'lucide-react';
import { ListItemDetailsDialog } from './ListItemDetailsDialog';
import { EditListDialog } from './EditListDialog';
import { ExportListButton } from './ExportListButton';
import { formatDateTimeToDDMMYYYY } from '@/lib/dateFormat';

interface ListDetailsDialogProps {
  list: List | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (list: List) => void;
  onDelete: () => void;
  onArchive: () => void;
  onDeleteItem: (itemId: string) => void;
}

export const ListDetailsDialog = ({ list, open, onClose, onUpdate, onDelete, onArchive, onDeleteItem }: ListDetailsDialogProps) => {
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  const [itemDetailsOpen, setItemDetailsOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemPriority, setNewItemPriority] = useState(3);
  const [newItemDateTime, setNewItemDateTime] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');

  if (!list) return null;

  const handleToggleComplete = (itemId: string) => {
    const updatedItems = list.items.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    onUpdate({ ...list, items: updatedItems });
  };

  const handleToggleFavorite = () => {
    onUpdate({ ...list, favorite: !list.favorite });
  };

  const handleShowItemDetails = (item: ListItem) => {
    setSelectedItem(item);
    setItemDetailsOpen(true);
  };

  const handleUpdateItem = (updatedItem: ListItem) => {
    const updatedItems = list.items.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );
    onUpdate({ ...list, items: updatedItems });
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 5) return 'text-red-500';
    if (priority >= 4) return 'text-orange-500';
    if (priority >= 3) return 'text-yellow-500';
    if (priority >= 2) return 'text-blue-500';
    return 'text-gray-500';
  };

  const getPriorityBadge = (priority: number) => {
    const colors = {
      5: 'bg-red-500',
      4: 'bg-orange-500',
      3: 'bg-yellow-500',
      2: 'bg-blue-500',
      1: 'bg-gray-500',
    };
    return colors[priority as keyof typeof colors] || colors[3];
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-2">
              <DialogTitle className="text-2xl">{list.title}</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleFavorite}
              >
                <Star className={`h-5 w-5 ${list.favorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Description */}
            {list.description && (
              <p className="text-muted-foreground">{list.description}</p>
            )}

            {/* Due date */}
            {list.dueDateTime && (
              <div className="text-sm">
                <span className="font-medium">Due: </span>
                <span className="text-muted-foreground">
                  {formatDateTimeToDDMMYYYY(list.dueDateTime)}
                </span>
              </div>
            )}

            {/* Notes */}
            {list.notes && (
              <div className="bg-muted p-3 rounded-md">
                <div className="text-sm font-medium mb-1">Notes</div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{list.notes}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <ExportListButton list={list} />
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={onArchive}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </Button>
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>

            {/* List items */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Items ({list.items.length})</h3>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setAddItemDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {list.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <Checkbox
                      checked={item.completed}
                      onCheckedChange={() => handleToggleComplete(item.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </span>
                        <div className={`h-2 w-2 rounded-full ${getPriorityBadge(item.priority)}`} />
                      </div>
                      
                      {item.dateTime && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDateTimeToDDMMYYYY(item.dateTime)}
                        </div>
                      )}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => handleShowItemDetails(item)}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ListItemDetailsDialog
        item={selectedItem}
        open={itemDetailsOpen}
        onClose={() => setItemDetailsOpen(false)}
        onUpdate={handleUpdateItem}
        onDelete={onDeleteItem}
      />

      <EditListDialog
        list={list}
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={onUpdate}
      />

      {/* Add Item Dialog */}
      <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newItemTitle">Title</Label>
              <Input
                id="newItemTitle"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="Item title"
              />
            </div>

            <div>
              <Label htmlFor="newItemPriority">Priority</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((p) => (
                  <Button
                    key={p}
                    variant={newItemPriority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNewItemPriority(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="newItemDateTime">Date & Time (Optional)</Label>
              <Input
                id="newItemDateTime"
                type="datetime-local"
                value={newItemDateTime}
                onChange={(e) => setNewItemDateTime(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="newItemNotes">Notes (Optional)</Label>
              <Textarea
                id="newItemNotes"
                value={newItemNotes}
                onChange={(e) => setNewItemNotes(e.target.value)}
                rows={4}
                placeholder="Add any additional notes..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setAddItemDialogOpen(false);
                  setNewItemTitle('');
                  setNewItemPriority(3);
                  setNewItemDateTime('');
                  setNewItemNotes('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (newItemTitle.trim()) {
                    const newItem: ListItem = {
                      id: Date.now().toString(),
                      title: newItemTitle.trim(),
                      priority: newItemPriority,
                      completed: false,
                      dateTime: newItemDateTime || undefined,
                      notes: newItemNotes.trim() || undefined,
                      createdAt: new Date().toISOString(),
                    };
                    onUpdate({ ...list, items: [...list.items, newItem] });
                    setAddItemDialogOpen(false);
                    setNewItemTitle('');
                    setNewItemPriority(3);
                    setNewItemDateTime('');
                    setNewItemNotes('');
                  }
                }}
                disabled={!newItemTitle.trim()}
              >
                Add Item
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
