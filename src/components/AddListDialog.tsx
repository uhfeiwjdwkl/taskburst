import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { List, ListItem } from '@/types/list';
import { Switch } from '@/components/ui/switch';

interface AddListDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (list: Omit<List, 'id' | 'createdAt' | 'order'>) => void;
}

export const AddListDialog = ({ open, onClose, onAdd }: AddListDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [listText, setListText] = useState('');
  const [useDotPoints, setUseDotPoints] = useState(true);

  const handleSubmit = () => {
    if (!title.trim() || !listText.trim()) return;

    // Parse list items
    const lines = listText.split('\n').filter(line => line.trim());
    const items: ListItem[] = lines.map((line, index) => {
      // Remove bullet points or dashes at the start
      const cleanedLine = line.replace(/^[•\-*]\s*/, '').trim();
      return {
        id: `${Date.now()}-${index}`,
        title: cleanedLine,
        priority: 3,
        completed: false,
        createdAt: new Date().toISOString(),
      };
    });

    const newList: Omit<List, 'id' | 'createdAt' | 'order'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      favorite: false,
      items,
    };

    onAdd(newList);
    
    // Reset form
    setTitle('');
    setDescription('');
    setListText('');
    setUseDotPoints(true);
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
            <Label htmlFor="listText">Paste Your List</Label>
            <div className="flex items-center gap-2 mb-2">
              <Switch
                checked={useDotPoints}
                onCheckedChange={setUseDotPoints}
                id="dotpoints"
              />
              <Label htmlFor="dotpoints" className="text-sm cursor-pointer">
                {useDotPoints ? 'Dot points (• item)' : 'Line breaks (one per line)'}
              </Label>
            </div>
            <Textarea
              id="listText"
              value={listText}
              onChange={(e) => setListText(e.target.value)}
              placeholder={useDotPoints 
                ? "• First item\n• Second item\n• Third item" 
                : "First item\nSecond item\nThird item"
              }
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {useDotPoints 
                ? 'Items starting with •, -, or * will be parsed as separate list items'
                : 'Each line will be treated as a separate list item'
              }
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!title.trim() || !listText.trim()}>
              Create List
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
