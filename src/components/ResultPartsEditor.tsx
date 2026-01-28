import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, X } from 'lucide-react';

interface Part {
  name: string;
  score: number | null;
  maxScore: number;
  notes?: string;
}

interface ResultPartsEditorProps {
  open: boolean;
  onClose: () => void;
  onSave: (parts: Part[]) => void;
  parts: Part[];
  itemName: string;
}

export function ResultPartsEditor({ open, onClose, onSave, parts, itemName }: ResultPartsEditorProps) {
  const [editedParts, setEditedParts] = useState<Part[]>([]);

  useEffect(() => {
    if (parts.length > 0) {
      setEditedParts([...parts]);
    } else {
      setEditedParts([
        { name: 'Part 1', score: null, maxScore: 25, notes: '' },
        { name: 'Part 2', score: null, maxScore: 25, notes: '' },
        { name: 'Part 3', score: null, maxScore: 25, notes: '' },
        { name: 'Part 4', score: null, maxScore: 25, notes: '' },
      ]);
    }
  }, [parts, open]);

  const handleAddPart = () => {
    setEditedParts([
      ...editedParts,
      { name: `Part ${editedParts.length + 1}`, score: null, maxScore: 25, notes: '' }
    ]);
  };

  const handleRemovePart = (index: number) => {
    if (editedParts.length > 1) {
      setEditedParts(editedParts.filter((_, i) => i !== index));
    }
  };

  const handlePartChange = (index: number, field: keyof Part, value: string) => {
    const updated = [...editedParts];
    if (field === 'maxScore') {
      updated[index][field] = parseFloat(value) || 0;
    } else if (field === 'name') {
      updated[index][field] = value;
    }
    setEditedParts(updated);
  };

  const handleSave = () => {
    onSave(editedParts);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-lg max-h-[80vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Edit Parts - {itemName}</DialogTitle>
            <DialogDescription>Customize the parts for this result</DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {editedParts.map((part, index) => (
            <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Name</Label>
                <Input
                  value={part.name}
                  onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                  placeholder="Part name"
                  className="h-8"
                />
              </div>
              <div className="w-24">
                <Label className="text-xs text-muted-foreground">Max Score</Label>
                <Input
                  type="number"
                  value={part.maxScore}
                  onChange={(e) => handlePartChange(index, 'maxScore', e.target.value)}
                  className="h-8"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="mt-5"
                onClick={() => handleRemovePart(index)}
                disabled={editedParts.length <= 1}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={handleAddPart}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Part
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Parts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}