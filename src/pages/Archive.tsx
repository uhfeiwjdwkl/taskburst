import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Trash2, Clock, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Archive = () => {
  const navigate = useNavigate();
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);

  useEffect(() => {
    const archived = localStorage.getItem('archivedTasks');
    if (archived) {
      setArchivedTasks(JSON.parse(archived));
    }
  }, []);

  const handleUncomplete = (taskId: string) => {
    const task = archivedTasks.find(t => t.id === taskId);
    if (task) {
      const uncompleted = { ...task, completed: false };
      const activeTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      localStorage.setItem('tasks', JSON.stringify([...activeTasks, uncompleted]));
      
      const updated = archivedTasks.filter(t => t.id !== taskId);
      setArchivedTasks(updated);
      localStorage.setItem('archivedTasks', JSON.stringify(updated));
      toast.success('Task moved back to active tasks');
    }
  };

  const handleDelete = (taskId: string) => {
    const task = archivedTasks.find(t => t.id === taskId);
    if (task) {
      const deletedTask = { ...task, deletedAt: new Date().toISOString() };
      const deleted = JSON.parse(localStorage.getItem('deletedArchive') || '[]');
      localStorage.setItem('deletedArchive', JSON.stringify([...deleted, deletedTask]));
      
      const updated = archivedTasks.filter(t => t.id !== taskId);
      setArchivedTasks(updated);
      localStorage.setItem('archivedTasks', JSON.stringify(updated));
      toast.success('Task moved to recently deleted');
    }
  };

  const getPriorityLabel = (importance: number) => {
    const labels = ['None', 'Low', 'Medium', 'High', 'Urgent', 'Critical'];
    return labels[importance] || 'None';
  };

  const importanceColors = [
    'bg-muted text-muted-foreground',
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <header className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-success bg-clip-text text-transparent">
              Archive
            </h1>
            <p className="text-muted-foreground mt-1">
              Completed tasks ({archivedTasks.length})
            </p>
          </div>
        </header>

        {archivedTasks.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground">
              No completed tasks yet. Finish some tasks to see them here!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {archivedTasks.map((task) => (
              <Card key={task.id} className="p-4 opacity-80">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg truncate">
                        {task.name}
                      </h3>
                      <Badge className={importanceColors[task.importance]}>
                        {getPriorityLabel(task.importance)}
                      </Badge>
                    </div>

                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{Math.round(task.spentMinutes)}m spent</span>
                      </div>
                      {task.dueDate && (
                        <div>
                          Due: {new Date(task.dueDate).toLocaleDateString('en-GB')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUncomplete(task.id)}
                    >
                      <Undo2 className="h-4 w-4 mr-1" />
                      Uncomplete
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(task.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Archive;
