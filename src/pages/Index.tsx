import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import Timer from '@/components/Timer';
import TaskCard from '@/components/TaskCard';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import TaskDetailsViewDialog from '@/components/TaskDetailsViewDialog';
import AddTaskDialog from '@/components/AddTaskDialog';
import { Button } from '@/components/ui/button';
import { Plus, Archive, Calendar, FolderOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Index = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    } else {
      // Add a sample task for first-time users
      const sampleTask: Task = {
        id: '1',
        name: 'Welcome to Focus Timer! 🎯',
        description: 'Click the Study button to start a 25-minute work session. Edit this task or add your own!',
        category: 'Study',
        importance: 3,
        estimatedMinutes: 25,
        spentMinutes: 0,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completed: false,
        createdAt: new Date().toISOString(),
      };
      setTasks([sampleTask]);
      localStorage.setItem('tasks', JSON.stringify([sampleTask]));
    }
  }, []);

  // Save tasks to localStorage whenever they change
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
    setTasks([...tasks, task]);
    toast.success('Task added successfully!');
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    toast.success('Task updated!');
  };

  const handleStartFocus = (taskId: string) => {
    setActiveTaskId(taskId);
    const task = tasks.find(t => t.id === taskId);
    toast.success(`Starting focus session for: ${task?.name}`);
  };

  const handleTimerTick = (seconds: number) => {
    if (activeTaskId) {
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === activeTaskId
            ? { ...task, spentMinutes: task.spentMinutes + (seconds / 60) }
            : task
        )
      );
    }
  };

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const completedTask = { ...task, completed: true };
      
      // Move to archive
      const archived = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
      localStorage.setItem('archivedTasks', JSON.stringify([...archived, completedTask]));
      
      // Remove from active tasks
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task completed and archived! 🎉');
    }
  };

  const handleShowDetails = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setDetailsDialogOpen(true);
    }
  };

  const handleEdit = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setEditDialogOpen(true);
    }
  };

  // Sort tasks by importance (highest first)
  const sortedTasks = [...tasks].sort((a, b) => b.importance - a.importance);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Focus Timer
            </h1>
            <p className="text-muted-foreground mt-1">Stay productive with Pomodoro technique</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/categories')}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Categories
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/calendar')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/archive')}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          </div>
        </header>

        {/* Timer Section */}
        <section className="bg-card rounded-2xl shadow-lg p-8 mb-8 border border-border">
          <Timer onTick={handleTimerTick} activeTaskId={activeTaskId} />
        </section>

        {/* Tasks Section */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            Your Tasks ({sortedTasks.length})
          </h2>
          {sortedTasks.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-lg border border-border">
              <p className="text-muted-foreground mb-4">No tasks yet. Add your first task to get started!</p>
              <Button
                onClick={() => setAddDialogOpen(true)}
                className="bg-gradient-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Task
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStartFocus={handleStartFocus}
                  onShowDetails={handleShowDetails}
                  onEdit={handleEdit}
                  onComplete={handleCompleteTask}
                />
              ))}
            </div>
          )}
        </section>

        {/* Dialogs */}
        <TaskDetailsDialog
          task={selectedTask}
          open={editDialogOpen}
          onClose={() => setEditDialogOpen(false)}
          onSave={handleUpdateTask}
        />

        <TaskDetailsViewDialog
          task={selectedTask}
          open={detailsDialogOpen}
          onClose={() => setDetailsDialogOpen(false)}
        />

        <AddTaskDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onAdd={handleAddTask}
        />
      </div>
    </div>
  );
};

export default Index;
