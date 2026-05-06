import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Subtask, ScheduledItem } from '@/types/subtask';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, CheckCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTimeTo12Hour } from '@/lib/dateFormat';

interface CurrentScheduledTaskProps {
  tasks: Task[];
  onUpdateTask?: (task: Task) => void;
}

export const CurrentScheduledTask = ({ tasks, onUpdateTask }: CurrentScheduledTaskProps) => {
  const [currentItems, setCurrentItems] = useState<{
    type: 'task' | 'subtask';
    task: Task;
    subtask?: Subtask;
  }[]>([]);

  useEffect(() => {
    const checkScheduled = () => {
      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const today = now.toISOString().split('T')[0];
      const found: typeof currentItems = [];
      for (const task of tasks) {
        if (task.completed) continue;
        if (task.subtasks) {
          for (const subtask of task.subtasks) {
            if (subtask.completed) continue;
            if (subtask.dueDate === today && subtask.scheduledTime) {
              const scheduledMinutes = timeToMinutes(subtask.scheduledTime);
              const currentMinutes = timeToMinutes(currentTime);
              const duration = subtask.estimatedMinutes || 30;
              if (currentMinutes >= scheduledMinutes && currentMinutes < scheduledMinutes + duration) {
                found.push({ type: 'subtask', task, subtask });
              }
            }
          }
        }
      }
      setCurrentItems(found);
    };

    checkScheduled();
    const interval = setInterval(checkScheduled, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks]);

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  if (currentItems.length === 0) return null;

  const handleComplete = (task: Task, subtask?: Subtask) => {
    if (!onUpdateTask) return;
    if (subtask) {
      const updated = {
        ...task,
        subtasks: (task.subtasks || []).map(s => s.id === subtask.id ? { ...s, completed: true } : s),
      };
      onUpdateTask(updated);
    } else {
      onUpdateTask({ ...task, completed: true });
    }
  };

  return (
    <Card className="border-primary/50 bg-primary/5 mb-4">
      <CardContent className="py-4 space-y-3">
        {currentItems.map(({ type, task, subtask }, idx) => (
          <div key={`${task.id}-${subtask?.id ?? 'task'}-${idx}`} className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {type === 'subtask' ? 'Scheduled Subtask' : 'Scheduled Task'}
                </Badge>
                {subtask?.scheduledTime && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimeTo12Hour(subtask.scheduledTime)}
                  </span>
                )}
              </div>
              <p className="font-semibold mt-1">
                {type === 'subtask' ? subtask?.title : task.name}
              </p>
              {type === 'subtask' && (
                <p className="text-sm text-muted-foreground">Part of: {task.name}</p>
              )}
            </div>
            {type === 'subtask' && onUpdateTask && (
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleComplete(task, subtask)} aria-label="Mark complete">
                <Check className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
