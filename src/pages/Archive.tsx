import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { List } from '@/types/list';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Trash2, Clock, Undo2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ExportImportButton } from '@/components/ExportImportButton';

const Archive = () => {
  const navigate = useNavigate();
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [archivedLists, setArchivedLists] = useState<List[]>([]);

  useEffect(() => {
    const archived = localStorage.getItem('archivedTasks');
    if (archived) {
      setArchivedTasks(JSON.parse(archived));
    }

    const lists = localStorage.getItem('lists');
    if (lists) {
      const allLists: List[] = JSON.parse(lists);
      setArchivedLists(allLists.filter(l => l.archivedAt && !l.deletedAt));
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

  const handleUncompleteList = (listId: string) => {
    const list = archivedLists.find(l => l.id === listId);
    if (list) {
      const { archivedAt, ...uncompleted } = list;
      const allLists = JSON.parse(localStorage.getItem('lists') || '[]');
      const updated = allLists.map((l: List) => l.id === listId ? uncompleted : l);
      localStorage.setItem('lists', JSON.stringify(updated));
      
      const updatedArchived = archivedLists.filter(l => l.id !== listId);
      setArchivedLists(updatedArchived);
      toast.success('List moved back to active lists');
    }
  };

  const handleDeleteList = (listId: string) => {
    const list = archivedLists.find(l => l.id === listId);
    if (list) {
      const deletedList = { ...list, deletedAt: new Date().toISOString() };
      const allLists = JSON.parse(localStorage.getItem('lists') || '[]');
      const updated = allLists.map((l: List) => l.id === listId ? deletedList : l);
      localStorage.setItem('lists', JSON.stringify(updated));
      
      const updatedArchived = archivedLists.filter(l => l.id !== listId);
      setArchivedLists(updatedArchived);
      toast.success('List moved to recently deleted');
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
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
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
                {archivedTasks.length} tasks, {archivedLists.length} lists
              </p>
            </div>
          </div>
          <ExportImportButton
            data={archivedTasks}
            filename={`archive-${new Date().toISOString().split('T')[0]}.json`}
            onImport={(data) => {
              setArchivedTasks(data);
              localStorage.setItem('archivedTasks', JSON.stringify(data));
              toast.success('Archive data imported successfully!');
            }}
            storageKey="archivedTasks"
          />
        </header>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tasks">Tasks ({archivedTasks.length})</TabsTrigger>
            <TabsTrigger value="lists">Lists ({archivedLists.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            {archivedTasks.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No completed tasks yet. Finish some tasks to see them here!
              </Card>
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
                      Undo Complete
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
          </TabsContent>

          <TabsContent value="lists" className="space-y-4 mt-4">
            {archivedLists.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No archived lists yet. Archive some lists to see them here!
              </Card>
            ) : (
              <div className="space-y-4">
                {archivedLists.map((list) => (
                  <Card key={list.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate mb-2">
                          {list.title}
                        </h3>
                        {list.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {list.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div>
                            {list.items.length} items • {list.items.filter(i => i.completed).length} completed
                          </div>
                          {list.dueDateTime && (
                            <div>
                              Due: {new Date(list.dueDateTime).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUncompleteList(list.id)}
                        >
                          <Undo2 className="h-4 w-4 mr-1" />
                          Unarchive
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteList(list.id)}
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Archive;
