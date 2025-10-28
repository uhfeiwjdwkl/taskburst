import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Clock, Info, Play, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TaskCardProps {
  task: Task;
  onStartFocus: (taskId: string) => void;
  onShowDetails: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

const TaskCard = ({ task, onStartFocus, onShowDetails, onComplete }: TaskCardProps) => {
  const progressPercentage = task.estimatedMinutes > 0 
    ? Math.min((task.spentMinutes / task.estimatedMinutes) * 100, 100)
    : 0;

  const remainingMinutes = Math.max(task.estimatedMinutes - task.spentMinutes, 0);
  
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
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{remainingMinutes}m left</span>
            </div>
            {task.dueDate && (
              <div>
                Due: {new Date(task.dueDate).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-primary transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {task.spentMinutes} / {task.estimatedMinutes} minutes
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onStartFocus(task.id)}
              className="bg-gradient-primary hover:opacity-90"
            >
              <Play className="h-4 w-4 mr-1" />
              Focus
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
              onClick={() => onComplete(task.id)}
              className="ml-auto"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Complete
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
