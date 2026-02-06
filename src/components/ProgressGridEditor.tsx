import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { ProgressGridBox } from './ProgressGridShape';
import { SubtaskProgressPopup } from './SubtaskProgressPopup';
import { SubtaskDialog } from './SubtaskDialog';
import { useAppSettings } from '@/hooks/useAppSettings';

interface ProgressGridEditorProps {
  task: Task;
  open: boolean;
  onClose: () => void;
  onSave: (filled: number, filledIndices: number[], updatedSubtasks?: Subtask[]) => void;
  onCompleteSubtask?: (subtaskId: string) => void;
  onUncompleteSubtask?: (subtaskId: string) => void;
  onUpdateSubtask?: (subtask: Subtask) => void;
  title: string;
  description: string;
}

const ProgressGridEditor = ({ 
  task, 
  open, 
  onClose, 
  onSave, 
  onCompleteSubtask, 
  onUncompleteSubtask,
  onUpdateSubtask,
  title, 
  description 
}: ProgressGridEditorProps) => {
  const [filledIndices, setFilledIndices] = useState<number[]>([]);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>([]);
  const settings = useAppSettings();

  // Initialize from existing progressGridFilled 
  useEffect(() => {
    if (open) {
      const storedIndices = getStoredFilledIndices(task.id);
      if (storedIndices) {
        setFilledIndices(storedIndices);
      } else {
        setFilledIndices(Array.from({ length: task.progressGridFilled }, (_, i) => i));
      }
      setSelectedBox(null);
      setEditingSubtask(null);
      setLocalSubtasks(task.subtasks || []);
    }
  }, [open, task.id, task.progressGridFilled, task.subtasks]);

  // Get subtask linked to a specific grid index
  const getSubtaskForIndex = (index: number): Subtask | undefined => {
    return localSubtasks.find(s => s.linkedToProgressGrid && s.progressGridIndex === index);
  };

  const handleGridClick = (index: number) => {
    const subtask = getSubtaskForIndex(index);
    
    if (subtask) {
      setSelectedBox(selectedBox === index ? null : index);
    } else {
      setFilledIndices(prev => {
        if (prev.includes(index)) {
          return prev.filter(i => i !== index);
        } else {
          return [...prev, index].sort((a, b) => a - b);
        }
      });
    }
  };

  const handleCompleteSubtask = (subtaskId: string, index: number) => {
    if (!filledIndices.includes(index)) {
      setFilledIndices(prev => [...prev, index].sort((a, b) => a - b));
    }
    setLocalSubtasks(prev => prev.map(s => 
      s.id === subtaskId ? { ...s, completed: true } : s
    ));
    onCompleteSubtask?.(subtaskId);
    setSelectedBox(null);
  };

  const handleUncompleteSubtask = (subtaskId: string, index: number) => {
    setFilledIndices(prev => prev.filter(i => i !== index));
    setLocalSubtasks(prev => prev.map(s => 
      s.id === subtaskId ? { ...s, completed: false } : s
    ));
    onUncompleteSubtask?.(subtaskId);
    setSelectedBox(null);
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setSelectedBox(null);
    setEditingSubtask(subtask);
  };

  const handleSaveEditedSubtask = (updatedSubtask: Subtask) => {
    setLocalSubtasks(prev => prev.map(s => 
      s.id === updatedSubtask.id ? updatedSubtask : s
    ));
    onUpdateSubtask?.(updatedSubtask);
    setEditingSubtask(null);
  };

  const handleSave = () => {
    storeFilledIndices(task.id, filledIndices);
    onSave(filledIndices.length, filledIndices, localSubtasks);
  };

  const filledCount = filledIndices.length;
  const progressPercentage = task.progressGridSize > 0
    ? Math.round((filledCount / task.progressGridSize) * 100)
    : 0;

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}}>
        <DialogContent 
          className="max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          
          <div className="py-4">
            <div className="text-center mb-4">
              <h3 className="font-semibold text-lg mb-2">{task.name}</h3>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                {Array.from({ length: task.progressGridSize }).map((_, index) => {
                  const subtask = getSubtaskForIndex(index);
                  const isFilled = filledIndices.includes(index);
                  const isSelected = selectedBox === index;
                  const displayText = subtask 
                    ? (subtask.abbreviation || subtask.title.charAt(0).toUpperCase())
                    : null;
                  
                  return (
                    <div key={index} className="relative">
                      <ProgressGridBox
                        icon={settings.progressGridIcon}
                        filled={isFilled}
                        color={settings.progressGridColor}
                        size={32}
                        isSubtask={!!subtask}
                        subtaskColor={subtask?.color}
                        textSize="sm"
                        onClick={() => handleGridClick(index)}
                        className={cn(
                          isSelected && 'ring-2 ring-ring',
                          subtask && !isFilled && !subtask.completed && 'ring-2 ring-ring/50'
                        )}
                      >
                        {subtask ? displayText : undefined}
                      </ProgressGridBox>
                      
                      {/* Subtask popup */}
                      {isSelected && subtask && (
                        <SubtaskProgressPopup
                          subtask={subtask}
                          estimatedRemaining={subtask.estimatedMinutes}
                          onComplete={() => handleCompleteSubtask(subtask.id, index)}
                          onUncomplete={() => handleUncompleteSubtask(subtask.id, index)}
                          onClose={() => setSelectedBox(null)}
                          onViewDetails={() => handleEditSubtask(subtask)}
                          onEdit={() => handleEditSubtask(subtask)}
                          position="bottom"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="text-lg font-semibold bg-gradient-primary bg-clip-text text-transparent">
                {progressPercentage}% ({filledCount}/{task.progressGridSize})
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

      {/* Edit Subtask Dialog */}
      <SubtaskDialog
        subtask={editingSubtask}
        open={!!editingSubtask}
        onClose={() => setEditingSubtask(null)}
        onSave={handleSaveEditedSubtask}
        taskId={task.id}
        availableGridIndices={[]}
      />
    </>
  );
};

// Helper functions to store/retrieve non-sequential filled indices
const FILLED_INDICES_KEY = 'progressGridFilledIndices';

function getStoredFilledIndices(taskId: string): number[] | null {
  const stored = localStorage.getItem(FILLED_INDICES_KEY);
  if (!stored) return null;
  const data = JSON.parse(stored);
  return data[taskId] || null;
}

function storeFilledIndices(taskId: string, indices: number[]): void {
  const stored = localStorage.getItem(FILLED_INDICES_KEY);
  const data = stored ? JSON.parse(stored) : {};
  data[taskId] = indices;
  localStorage.setItem(FILLED_INDICES_KEY, JSON.stringify(data));
}

export default ProgressGridEditor;
