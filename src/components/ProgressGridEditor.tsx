import { useState } from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface ProgressGridEditorProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onSave: (filled: number) => void;
  title: string;
  description: string;
}

const ProgressGridEditor = ({ task, open, onClose, onSave, title, description }: ProgressGridEditorProps) => {
  const [filled, setFilled] = useState(task.progressGridFilled);

  const handleGridClick = (index: number) => {
    const newFilled = index < filled ? index : index + 1;
    setFilled(newFilled);
  };

  const handleSave = () => {
    onSave(filled);
    onClose();
  };

  const progressPercentage = task.progressGridSize > 0
    ? Math.round((filled / task.progressGridSize) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="text-center mb-4">
            <h3 className="font-semibold text-lg mb-2">{task.name}</h3>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap gap-1 justify-center max-w-xs">
              {Array.from({ length: task.progressGridSize }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleGridClick(index)}
                  className={cn(
                    "w-6 h-6 border border-border rounded-sm transition-all hover:scale-110",
                    index < filled
                      ? "bg-gradient-primary"
                      : "bg-secondary"
                  )}
                  aria-label={`Toggle progress square ${index + 1}`}
                />
              ))}
            </div>
            <div className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
              {progressPercentage}% ({filled}/{task.progressGridSize})
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-primary">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProgressGridEditor;
