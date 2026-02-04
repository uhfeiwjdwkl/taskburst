import { useState } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Info, Play, CheckCircle2, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SubtaskDetailsPopup } from './SubtaskDetailsPopup';
import { SubtaskFullDetailsDialog } from './SubtaskFullDetailsDialog';
import { SubtaskDialog } from './SubtaskDialog';

interface TaskCardProps {
  task: Task;
  onStartFocus: (taskId: string) => void;
  onShowDetails: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
}

// Helper to get stored filled indices for non-sequential grid
const getStoredFilledIndices = (taskId: string): number[] | null => {
  const stored = localStorage.getItem('progressGridFilledIndices');
  if (!stored) return null;
  const data = JSON.parse(stored);
  return data[taskId] || null;
};

const storeFilledIndices = (taskId: string, indices: number[]): void => {
  const stored = localStorage.getItem('progressGridFilledIndices');
  const data = stored ? JSON.parse(stored) : {};
  data[taskId] = indices;
  localStorage.setItem('progressGridFilledIndices', JSON.stringify(data));
};

const TaskCard = ({ task, onStartFocus, onShowDetails, onEdit, onComplete, onDelete, onUpdateTask }: TaskCardProps) => {
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [fullDetailsSubtask, setFullDetailsSubtask] = useState<Subtask | null>(null);
  const [editingSubtask, setEditingSubtask] = useState<Subtask | null>(null);

  const remainingMinutes = Math.max(task.estimatedMinutes - task.spentMinutes, 0);
  const remainingSeconds = Math.round(remainingMinutes * 60);
  const remainingMins = Math.floor(remainingSeconds / 60);
  const remainingSecs = remainingSeconds % 60;

  const spentSeconds = Math.round(task.spentMinutes * 60);
  const spentMins = Math.floor(spentSeconds / 60);
  const spentSecs = spentSeconds % 60;
  const formattedSpent = `${spentMins}:${spentSecs.toString().padStart(2, '0')}`;
  
  const importanceColors = [
    'bg-muted text-muted-foreground',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ];

  const getPriorityLabel = (importance: number) => {
    const labels = ['None', 'Low', 'Medium', 'High', 'Urgent', 'Critical'];
    return labels[importance] || 'None';
  };

  // Get non-sequential filled indices
  const currentFilledIndices = getStoredFilledIndices(task.id) || 
    Array.from({ length: task.progressGridFilled }, (_, i) => i);

  const progressPercentage = task.progressGridSize > 0
    ? Math.round((currentFilledIndices.length / task.progressGridSize) * 100)
    : 0;

  // Get subtask for a specific grid index
  const getSubtaskForIndex = (index: number): Subtask | undefined => {
    return task.subtasks?.find(s => s.linkedToProgressGrid && s.progressGridIndex === index);
  };

  const handleGridClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const subtask = getSubtaskForIndex(index);
    
    if (subtask) {
      // If there's a linked subtask, show popup
      setSelectedBox(selectedBox === index ? null : index);
    } else {
      // Toggle the box (non-sequential) for non-subtask boxes
      let newIndices: number[];
      if (currentFilledIndices.includes(index)) {
        newIndices = currentFilledIndices.filter(i => i !== index);
      } else {
        newIndices = [...currentFilledIndices, index].sort((a, b) => a - b);
      }
      
      storeFilledIndices(task.id, newIndices);
      
      onUpdateTask({
        ...task,
        progressGridFilled: newIndices.length,
      });
    }
  };

  const handleCompleteSubtask = (subtaskId: string, index: number) => {
    let newIndices = currentFilledIndices;
    if (!currentFilledIndices.includes(index)) {
      newIndices = [...currentFilledIndices, index].sort((a, b) => a - b);
    }
    
    storeFilledIndices(task.id, newIndices);
    
    const updatedSubtasks = (task.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, completed: true } : s
    );
    
    onUpdateTask({
      ...task,
      progressGridFilled: newIndices.length,
      subtasks: updatedSubtasks
    });
    setSelectedBox(null);
  };

  const handleUncompleteSubtask = (subtaskId: string, index: number) => {
    const newIndices = currentFilledIndices.filter(i => i !== index);
    
    storeFilledIndices(task.id, newIndices);
    
    const updatedSubtasks = (task.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, completed: false } : s
    );
    
    onUpdateTask({
      ...task,
      progressGridFilled: newIndices.length,
      subtasks: updatedSubtasks
    });
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
    const updatedSubtasks = (task.subtasks || []).map(s =>
      s.id === updatedSubtask.id ? updatedSubtask : s
    );
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
    setEditingSubtask(null);
  };

  return (
    <>
      <Card className="p-4 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg truncate">{task.name}</h3>
              <Badge className={importanceColors[task.importance]}>
                {getPriorityLabel(task.importance)}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
              {task.category && (
                <div className="flex items-center gap-1">
                  <Badge variant="outline">{task.category}</Badge>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{remainingMins}m {remainingSecs}s left</span>
              </div>
              {task.dueDate && (
                <div>
                  Due: {new Date(task.dueDate).toLocaleDateString('en-GB')}
                </div>
              )}
            </div>

            {/* Progress Grid - Non-sequential with subtask display */}
            <div className="mb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: task.progressGridSize }).map((_, index) => {
                    const subtask = getSubtaskForIndex(index);
                    const isFilled = currentFilledIndices.includes(index);
                    const isSelected = selectedBox === index;
                    
                    // For subtasks: always show abbreviation/first letter
                    const displayText = subtask 
                      ? (subtask.abbreviation || subtask.title.charAt(0).toUpperCase())
                      : null;
                    
                    return (
                      <div key={index} className="relative">
                        <button
                          onClick={(e) => handleGridClick(index, e)}
                          className={cn(
                            "w-4 h-4 border border-border rounded-sm transition-all hover:scale-110 flex items-center justify-center text-[8px] font-medium",
                            isFilled && !subtask && "bg-gradient-primary",
                            !isFilled && !subtask && "bg-secondary",
                            subtask && "ring-1 ring-primary/50",
                            isSelected && "ring-2 ring-primary"
                          )}
                          style={subtask ? {
                            // Subtask: completed = filled color bg, incomplete = light bg
                            backgroundColor: subtask.completed 
                              ? (subtask.color || 'hsl(var(--primary))') 
                              : `${subtask.color || 'hsl(var(--primary))'}20`,
                            borderColor: subtask.color || 'hsl(var(--primary))',
                            color: subtask.completed ? 'white' : (subtask.color || 'hsl(var(--primary))'),
                          } : undefined}
                          aria-label={`Toggle progress square ${index + 1}${subtask ? ` - ${subtask.title}` : ''}`}
                          title={subtask ? subtask.title : `Box ${index + 1}`}
                        >
                          {displayText && (
                            <span className="truncate">
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
                            position="bottom"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                  {progressPercentage}%
                </div>
              </div>
              
              {/* Timer Progress Bar */}
              <div className="space-y-1 mb-2">
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary transition-all duration-300"
                    style={{ width: `${Math.min((task.spentMinutes / task.estimatedMinutes) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {formattedSpent} / {Math.round(task.estimatedMinutes)} minutes
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => onStartFocus(task.id)}
                className="bg-gradient-primary hover:opacity-90"
              >
                <Play className="h-4 w-4 mr-1" />
                Study
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onShowDetails(task.id)}
              >
                <Info className="h-4 w-4 mr-1" />
                Details
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(task.id)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onComplete(task.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Complete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(task.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

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

export default TaskCard;