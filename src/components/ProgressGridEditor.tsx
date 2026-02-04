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
import { SubtaskDetailsPopup } from './SubtaskDetailsPopup';
import { SubtaskFullDetailsDialog } from './SubtaskFullDetailsDialog';
import { SubtaskDialog } from './SubtaskDialog';

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
  // Track filled boxes as an array of indices for non-sequential filling
  const [filledIndices, setFilledIndices] = useState<number[]>([]);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [fullDetailsSubtask, setFullDetailsSubtask] = useState<Subtask | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);
  const [localSubtasks, setLocalSubtasks] = useState<Subtask[]>([]);

  // Initialize from existing progressGridFilled 
  useEffect(() => {
    if (open) {
      // Check if task has filledIndices stored, otherwise use sequential from progressGridFilled
      const storedIndices = getStoredFilledIndices(task.id);
      if (storedIndices) {
        setFilledIndices(storedIndices);
      } else {
        // Backwards compatibility: assume sequential filling
        setFilledIndices(Array.from({ length: task.progressGridFilled }, (_, i) => i));
      }
      setSelectedBox(null);
      setFullDetailsSubtask(null);
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
      // If there's a linked subtask (completed or not), show popup
      setSelectedBox(selectedBox === index ? null : index);
    } else {
      // Toggle the box directly (non-sequential)
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
    // Fill the grid box
    if (!filledIndices.includes(index)) {
      setFilledIndices(prev => [...prev, index].sort((a, b) => a - b));
    }
    // Update local subtasks
    setLocalSubtasks(prev => prev.map(s => 
      s.id === subtaskId ? { ...s, completed: true } : s
    ));
    // Complete the subtask externally
    onCompleteSubtask?.(subtaskId);
    setSelectedBox(null);
  };

  const handleUncompleteSubtask = (subtaskId: string, index: number) => {
    // Unfill the grid box
    setFilledIndices(prev => prev.filter(i => i !== index));
    // Update local subtasks
    setLocalSubtasks(prev => prev.map(s => 
      s.id === subtaskId ? { ...s, completed: false } : s
    ));
    // Uncomplete the subtask externally
    onUncompleteSubtask?.(subtaskId);
    setSelectedBox(null);
  };

  const handleViewFullDetails = (subtask: Subtask) => {
    setSelectedBox(null);
    setFullDetailsSubtask(subtask);
  };

  const handleEditSubtask = (subtask: Subtask) => {
    setFullDetailsSubtask(null);
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
    // Store the indices for this task
    storeFilledIndices(task.id, filledIndices);
    // Return count, indices, and updated subtasks
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
                  
                  // For subtasks: always show abbreviation/first letter, completed changes color
                  const displayText = subtask 
                    ? (subtask.abbreviation || subtask.title.charAt(0).toUpperCase())
                    : null;
                  
                  return (
                    <div key={index} className="relative">
                      <button
                        onClick={() => handleGridClick(index)}
                        className={cn(
                          "w-8 h-8 border border-border rounded-sm transition-all hover:scale-110 flex items-center justify-center text-xs font-medium",
                          isFilled && !subtask && "bg-gradient-primary text-primary-foreground",
                          !isFilled && !subtask && "bg-secondary hover:bg-secondary/80",
                          subtask && "ring-1 ring-primary/50",
                          isSelected && "ring-2 ring-primary"
                        )}
                        style={subtask ? {
                          // Subtask: completed = filled color bg with white text, incomplete = light bg with colored text
                          backgroundColor: subtask.completed 
                            ? (subtask.color || 'hsl(var(--primary))') 
                            : `${subtask.color || 'hsl(var(--primary))'}20`,
                          borderColor: subtask.color || 'hsl(var(--primary))',
                          color: subtask.completed ? 'white' : (subtask.color || 'hsl(var(--primary))'),
                        } : undefined}
                        aria-label={`Toggle progress square ${index + 1}${subtask ? ` - ${subtask.title}` : ''}`}
                        title={subtask ? subtask.title : undefined}
                      >
                        {displayText && (
                          <span className="truncate px-0.5">
                            {displayText}
                          </span>
                        )}
                      </button>
                      
                      {/* Subtask popup */}
                      {isSelected && subtask && (
                        <SubtaskDetailsPopup
                          subtask={subtask}
                          onComplete={() => handleCompleteSubtask(subtask.id, index)}
                          onUncomplete={() => handleUncompleteSubtask(subtask.id, index)}
                          onClose={() => setSelectedBox(null)}
                          onViewFullDetails={() => handleViewFullDetails(subtask)}
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

      {/* Full Subtask Details Dialog */}
      <SubtaskFullDetailsDialog
        subtask={fullDetailsSubtask}
        open={!!fullDetailsSubtask}
        onClose={() => setFullDetailsSubtask(null)}
        onEdit={() => fullDetailsSubtask && handleEditSubtask(fullDetailsSubtask)}
        onComplete={() => {
          if (fullDetailsSubtask && fullDetailsSubtask.progressGridIndex !== undefined) {
            handleCompleteSubtask(fullDetailsSubtask.id, fullDetailsSubtask.progressGridIndex);
            setFullDetailsSubtask(null);
          }
        }}
        onUncomplete={() => {
          if (fullDetailsSubtask && fullDetailsSubtask.progressGridIndex !== undefined) {
            handleUncompleteSubtask(fullDetailsSubtask.id, fullDetailsSubtask.progressGridIndex);
            setFullDetailsSubtask(null);
          }
        }}
      />

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
