import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import AddTaskDialog from '@/components/AddTaskDialog';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import { format, isSameDay, parseISO } from 'date-fns';
import { toast } from 'sonner';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updatedTasks = [...tasks, task];
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    toast.success('Task added successfully!');
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const updatedTasks = tasks.map(t => t.id === updatedTask.id ? updatedTask : t);
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    toast.success('Task updated!');
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
  };

  const handleAddTaskForDate = () => {
    setAddDialogOpen(true);
  };

  const getTasksForDate = (date: Date | undefined) => {
    if (!date) return [];
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      try {
        const taskDate = parseISO(task.dueDate);
        return isSameDay(taskDate, date);
      } catch {
        return false;
      }
    });
  };

  const getDatesWithTasks = () => {
    const dates: Date[] = [];
    tasks.forEach(task => {
      if (task.dueDate) {
        try {
          const date = parseISO(task.dueDate);
          dates.push(date);
        } catch {
          // Invalid date, skip
        }
      }
    });
    return dates;
  };

  const tasksForSelectedDate = getTasksForDate(selectedDate);
  const datesWithTasks = getDatesWithTasks();

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
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Calendar View
            </h1>
            <p className="text-muted-foreground mt-1">
              Plan your tasks by date
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <Card className="p-6">
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className={cn("pointer-events-auto")}
                modifiers={{
                  hasTask: datesWithTasks,
                }}
                modifiersStyles={{
                  hasTask: {
                    fontWeight: 'bold',
                    textDecoration: 'underline',
                    textDecorationColor: 'hsl(var(--primary))',
                    textDecorationThickness: '2px',
                  },
                }}
              />
            </div>
          </Card>

          {/* Tasks for Selected Date */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tasksForSelectedDate.length} {tasksForSelectedDate.length === 1 ? 'task' : 'tasks'} due
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleAddTaskForDate}
                  className="bg-gradient-primary"
                  disabled={!selectedDate}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </Button>
              </div>

              {!selectedDate ? (
                <div className="text-center py-8 text-muted-foreground">
                  Select a date to view or add tasks
                </div>
              ) : tasksForSelectedDate.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-3">
                    No tasks due on this date
                  </p>
                  <Button
                    size="sm"
                    onClick={handleAddTaskForDate}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add First Task
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {tasksForSelectedDate.map((task) => (
                    <Card
                      key={task.id}
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => {
                        setSelectedTask(task);
                        setDetailsOpen(true);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{task.name}</h3>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={importanceColors[task.importance]}>
                              {getPriorityLabel(task.importance)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {task.estimatedMinutes}m estimated
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Legend */}
            <Card className="p-4">
              <h3 className="font-semibold text-sm mb-2">Legend</h3>
              <div className="text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <span className="font-bold underline" style={{ textDecorationColor: 'hsl(var(--primary))' }}>
                    Dates
                  </span>
                  with underline have tasks due
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Dialogs */}
        <AddTaskDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onAdd={handleAddTask}
          prefilledDate={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined}
        />

        <TaskDetailsDialog
          task={selectedTask}
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          onSave={handleUpdateTask}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
