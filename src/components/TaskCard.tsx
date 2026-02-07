import { useState } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Info, Play, CheckCircle2, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UniversalProgressGrid } from './UniversalProgressGrid';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onStartFocus: (taskId: string) => void;
  onShowDetails: (taskId: string) => void;
  onEdit: (taskId: string) => void;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onStartSubtask?: (subtask: Subtask, task: Task) => void;
}

const TaskCard = ({ task, onStartFocus, onShowDetails, onEdit, onComplete, onDelete, onUpdateTask, onStartSubtask }: TaskCardProps) => {
  const [subtasksOpen, setSubtasksOpen] = useState(false);
  const subtasks = task.subtasks || [];
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

  return (
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
                {task.subcategory && (
                  <Badge variant="secondary" className="text-xs">
                    → {task.subcategory}
                  </Badge>
                )}
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

          {/* Universal Progress Grid - matches TaskDetailsViewDialog */}
          <div className="mb-3">
            <div className="mb-2">
              <UniversalProgressGrid
                task={task}
                onUpdateTask={onUpdateTask}
                size="md"
                showPercentage={true}
                layout="inline"
                interactive={true}
              />
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

          {/* Collapsible Subtasks */}
          {subtasks.length > 0 && (
            <Collapsible open={subtasksOpen} onOpenChange={setSubtasksOpen} className="mb-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground hover:text-foreground px-0 h-7">
                  {subtasksOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                  Subtasks ({subtasks.filter(s => s.completed).length}/{subtasks.length})
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-1">
                <div className="space-y-1 pl-2 border-l-2 border-border">
                  {subtasks.map(subtask => (
                    <div
                      key={subtask.id}
                      className={cn(
                        "flex items-center gap-2 py-1 px-2 rounded text-sm",
                        subtask.completed ? "bg-muted/50 text-muted-foreground" : "hover:bg-muted/30"
                      )}
                    >
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => {
                          const updatedSubtasks = subtasks.map(s =>
                            s.id === subtask.id ? { ...s, completed: !s.completed } : s
                          );
                          
                          // Update progress grid if linked
                          let newProgressGridFilled = task.progressGridFilled;
                          if (subtask.linkedToProgressGrid && subtask.progressGridIndex !== undefined) {
                            const stored = localStorage.getItem('progressGridFilledIndices');
                            const data = stored ? JSON.parse(stored) : {};
                            let indices: number[] = data[task.id] || [];
                            
                            if (subtask.completed) {
                              // Uncompleting - remove index
                              indices = indices.filter(i => i !== subtask.progressGridIndex);
                              newProgressGridFilled = Math.max(0, task.progressGridFilled - 1);
                            } else {
                              // Completing - add index
                              if (!indices.includes(subtask.progressGridIndex)) {
                                indices = [...indices, subtask.progressGridIndex].sort((a, b) => a - b);
                              }
                              newProgressGridFilled = Math.min(task.progressGridSize, task.progressGridFilled + 1);
                            }
                            data[task.id] = indices;
                            localStorage.setItem('progressGridFilledIndices', JSON.stringify(data));
                          }
                          
                          onUpdateTask({ 
                            ...task, 
                            subtasks: updatedSubtasks,
                            progressGridFilled: newProgressGridFilled
                          });
                        }}
                        className="h-4 w-4"
                      />
                      <span className={cn("flex-1 truncate", subtask.completed && "line-through")}>
                        {subtask.title}
                      </span>
                      {subtask.estimatedMinutes && subtask.estimatedMinutes > 0 && (
                        <span className="text-xs text-muted-foreground">{subtask.estimatedMinutes}m</span>
                      )}
                      {onStartSubtask && !subtask.completed && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartSubtask(subtask, task);
                          }}
                        >
                          <Play className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

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
  );
};

export default TaskCard;
