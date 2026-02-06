import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { cn } from '@/lib/utils';
import { ProgressGridBox } from '@/components/ProgressGridShape';
import { SubtaskProgressPopup } from './SubtaskProgressPopup';
import { SubtaskDialog } from './SubtaskDialog';
import { useAppSettings } from '@/hooks/useAppSettings';

interface UniversalProgressGridProps {
  task: Task;
  onUpdateTask?: (task: Task) => void;
  /** Size of each grid box - 'sm' = 16px, 'md' = 24px, 'lg' = 28px */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show the percentage text next to the grid */
  showPercentage?: boolean;
  /** Layout direction for the grid container */
  layout?: 'inline' | 'centered';
  /** Whether the grid boxes are interactive (clickable) */
  interactive?: boolean;
}

// Helper to get stored filled indices
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

export const UniversalProgressGrid = ({
  task,
  onUpdateTask,
  size = 'md',
  showPercentage = true,
  layout = 'inline',
  interactive = true,
}: UniversalProgressGridProps) => {
  const [selectedBox, setSelectedBox] = useState<number | null>(null);
  const [filledIndices, setFilledIndices] = useState<number[]>([]);
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [activeSubtask, setActiveSubtask] = useState<Subtask | null>(null);
  const settings = useAppSettings();

  // Size mapping
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 28,
  };
  const boxSize = sizeMap[size];

  // Initialize filled indices when task changes
  useEffect(() => {
    const stored = getStoredFilledIndices(task.id);
    setFilledIndices(stored || Array.from({ length: task.progressGridFilled }, (_, i) => i));
  }, [task.id, task.progressGridFilled]);

  // Get subtask for a specific grid index
  const getSubtaskForIndex = (index: number): Subtask | undefined => {
    return task.subtasks?.find(s => s.linkedToProgressGrid && s.progressGridIndex === index);
  };

  const handleGridClick = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!interactive) return;

    const subtask = getSubtaskForIndex(index);

    // Subtask boxes always open the subtask popup
    if (subtask) {
      setSelectedBox(selectedBox === index ? null : index);
      return;
    }

    // Toggle the box (non-sequential)
    const newIndices = filledIndices.includes(index)
      ? filledIndices.filter(i => i !== index)
      : [...filledIndices, index].sort((a, b) => a - b);
    
    storeFilledIndices(task.id, newIndices);
    setFilledIndices(newIndices);
    
    if (onUpdateTask) {
      onUpdateTask({ ...task, progressGridFilled: newIndices.length });
    }
  };

  const handleCompleteSubtask = (subtaskId: string, index: number) => {
    if (!onUpdateTask) return;
    
    const updatedSubtasks = (task.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, completed: true } : s
    );
    
    const newIndices = filledIndices.includes(index)
      ? filledIndices
      : [...filledIndices, index].sort((a, b) => a - b);
    
    storeFilledIndices(task.id, newIndices);
    setFilledIndices(newIndices);
    
    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
      progressGridFilled: newIndices.length,
    });
    
    setSelectedBox(null);
  };

  const handleUncompleteSubtask = (subtaskId: string, index: number) => {
    if (!onUpdateTask) return;

    const updatedSubtasks = (task.subtasks || []).map(s =>
      s.id === subtaskId ? { ...s, completed: false } : s
    );

    const newIndices = filledIndices.includes(index)
      ? filledIndices.filter(i => i !== index)
      : filledIndices;

    storeFilledIndices(task.id, newIndices);
    setFilledIndices(newIndices);

    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
      progressGridFilled: newIndices.length,
    });

    setSelectedBox(null);
  };

  const handleSaveSubtask = (updatedSubtask: Subtask) => {
    if (!onUpdateTask) return;
    
    const updatedSubtasks = (task.subtasks || []).map(s =>
      s.id === updatedSubtask.id ? updatedSubtask : s
    );
    
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
    setSubtaskDialogOpen(false);
    setActiveSubtask(null);
  };

  const progressPercentage = task.progressGridSize > 0
    ? Math.round((filledIndices.length / task.progressGridSize) * 100)
    : 0;

  const containerClass = layout === 'centered' 
    ? 'flex flex-wrap gap-1 justify-center'
    : 'flex flex-wrap gap-1';

  return (
    <>
      <div className={cn(
        layout === 'inline' && 'flex items-center gap-3',
        layout === 'centered' && 'flex flex-col items-center gap-2'
      )}>
        <div className={containerClass}>
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
                  size={boxSize}
                  isSubtask={!!subtask}
                  subtaskColor={subtask?.color}
                  textSize={size === 'sm' ? 'xxs' : size === 'md' ? 'xs' : 'sm'}
                  onClick={() => handleGridClick(index)}
                  className={cn(
                    interactive && 'cursor-pointer',
                    !interactive && 'cursor-default',
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
                    onClose={() => setSelectedBox(null)}
                    onViewDetails={() => {
                      setActiveSubtask(subtask);
                      setSubtaskDialogOpen(true);
                    }}
                    onComplete={() => handleCompleteSubtask(subtask.id, index)}
                    onUncomplete={() => handleUncompleteSubtask(subtask.id, index)}
                    onEdit={() => {
                      setActiveSubtask(subtask);
                      setSubtaskDialogOpen(true);
                    }}
                    position={layout === 'inline' ? 'bottom' : 'top'}
                  />
                )}
              </div>
            );
          })}
        </div>
        
        {showPercentage && (
          <div className={cn(
            "font-semibold bg-gradient-primary bg-clip-text text-transparent",
            size === 'sm' && "text-sm",
            size === 'md' && "text-base",
            size === 'lg' && "text-lg"
          )}>
            {progressPercentage}%
          </div>
        )}
      </div>

      {/* Subtask Edit Dialog */}
      <SubtaskDialog
        subtask={activeSubtask}
        open={subtaskDialogOpen}
        onClose={() => {
          setSubtaskDialogOpen(false);
          setActiveSubtask(null);
        }}
        onSave={handleSaveSubtask}
        taskId={task.id}
        availableGridIndices={[]}
      />
    </>
  );
};

export default UniversalProgressGrid;
