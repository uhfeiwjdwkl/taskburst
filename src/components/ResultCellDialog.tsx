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
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';

interface ResultCellDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (score: number | null, maxScore: number, notes: string) => void;
  initialData: {
    name: string;
    score: number | null;
    maxScore: number;
    notes?: string;
  } | null;
}

export function ResultCellDialog({ open, onClose, onSave, initialData }: ResultCellDialogProps) {
  const [score, setScore] = useState<string>('');
  const [maxScore, setMaxScore] = useState<string>('25');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setScore(initialData.score !== null ? initialData.score.toString() : '');
      setMaxScore(initialData.maxScore.toString());
      setNotes(initialData.notes || '');
    }
  }, [initialData]);

  const handleSave = () => {
    const scoreNum = score === '' ? null : parseFloat(score);
    const maxScoreNum = parseFloat(maxScore) || 25;
    onSave(scoreNum, maxScoreNum, notes);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Edit Score - {initialData?.name || 'Part'}</DialogTitle>
            <DialogDescription>Enter the score and any notes</DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="score">Score</Label>
              <Input
                id="score"
                type="number"
                step="0.01"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="Enter score"
              />
            </div>
            <div>
              <Label htmlFor="maxScore">Max Score</Label>
              <Input
                id="maxScore"
                type="number"
                step="0.01"
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
          </div>
          
          {score !== '' && maxScore !== '' && (
            <div className="text-center p-3 bg-muted rounded-md">
              <div className="text-lg font-bold">
                {score}/{maxScore}
              </div>
              <div className="text-sm text-muted-foreground">
                {((parseFloat(score) / parseFloat(maxScore)) * 100).toFixed(2)}%
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this score..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}