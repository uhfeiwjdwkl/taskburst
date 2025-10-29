import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Session } from '@/types/session';
import { Timetable } from '@/types/timetable';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Undo2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const RecentlyDeletedUnified = () => {
  const [deletedTasks, setDeletedTasks] = useState<Task[]>([]);
  const [deletedSessions, setDeletedSessions] = useState<Session[]>([]);
  const [deletedArchive, setDeletedArchive] = useState<Task[]>([]);
  const [deletedTimetables, setDeletedTimetables] = useState<Timetable[]>([]);
  const [permanentDeleteDialog, setPermanentDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    loadAllDeleted();
  }, []);

  const loadAllDeleted = () => {
    // Load deleted tasks
    const tasks = JSON.parse(localStorage.getItem('deletedTasks') || '[]') as Task[];
    setDeletedTasks(tasks.filter(t => getDaysRemaining(t.deletedAt!) > 0).sort((a, b) => 
      new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
    ));

    // Load deleted sessions
    const sessions = JSON.parse(localStorage.getItem('deletedSessions') || '[]') as Session[];
    setDeletedSessions(sessions.filter(s => getDaysRemaining(s.deletedAt!) > 0).sort((a, b) => 
      new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
    ));

    // Load deleted archive items
    const archive = JSON.parse(localStorage.getItem('deletedArchive') || '[]') as Task[];
    setDeletedArchive(archive.filter(t => getDaysRemaining(t.deletedAt!) > 0).sort((a, b) => 
      new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
    ));

    // Load deleted timetables
    const timetables = JSON.parse(localStorage.getItem('timetables') || '[]') as Timetable[];
    const deletedTT = timetables.filter(t => t.deletedAt && getDaysRemaining(t.deletedAt) > 0)
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
    setDeletedTimetables(deletedTT);
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const expiryDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  // Task handlers
  const handleRestoreTask = (taskId: string) => {
    const task = deletedTasks.find(t => t.id === taskId);
    if (task) {
      const { deletedAt, ...cleanTask } = task;
      const activeTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
      localStorage.setItem('tasks', JSON.stringify([...activeTasks, cleanTask]));
      
      const updated = deletedTasks.filter(t => t.id !== taskId);
      localStorage.setItem('deletedTasks', JSON.stringify(updated));
      setDeletedTasks(updated);
      toast.success('Task restored');
    }
  };

  const handleRestoreSession = (sessionId: string) => {
    const session = deletedSessions.find(s => s.id === sessionId);
    if (session) {
      const { deletedAt, ...cleanSession } = session;
      const activeSessions = JSON.parse(localStorage.getItem('sessions') || '[]');
      localStorage.setItem('sessions', JSON.stringify([...activeSessions, cleanSession]));
      
      const updated = deletedSessions.filter(s => s.id !== sessionId);
      localStorage.setItem('deletedSessions', JSON.stringify(updated));
      
      // Restore task progress
      const tasks = JSON.parse(localStorage.getItem('tasks') || '[]') as Task[];
      const updatedTasks = tasks.map(task => {
        if (task.id === session.taskId) {
          return {
            ...task,
            spentMinutes: task.spentMinutes + session.duration,
          };
        }
        return task;
      });
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      
      loadAllDeleted();
      toast.success('Session restored');
    }
  };

  const handleRestoreArchive = (taskId: string) => {
    const task = deletedArchive.find(t => t.id === taskId);
    if (task) {
      const { deletedAt, ...cleanTask } = task;
      const archive = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
      localStorage.setItem('archivedTasks', JSON.stringify([...archive, cleanTask]));
      
      const updated = deletedArchive.filter(t => t.id !== taskId);
      localStorage.setItem('deletedArchive', JSON.stringify(updated));
      setDeletedArchive(updated);
      toast.success('Archive item restored');
    }
  };

  const handleRestoreTimetable = (timetableId: string) => {
    const allTimetables = JSON.parse(localStorage.getItem('timetables') || '[]') as Timetable[];
    const updated = allTimetables.map(t => {
      if (t.id === timetableId) {
        const { deletedAt, ...clean } = t;
        return clean;
      }
      return t;
    });
    localStorage.setItem('timetables', JSON.stringify(updated));
    loadAllDeleted();
    toast.success('Timetable restored');
  };

  const handlePermanentDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'task') {
      const updated = deletedTasks.filter(t => t.id !== itemToDelete.id);
      localStorage.setItem('deletedTasks', JSON.stringify(updated));
      setDeletedTasks(updated);
    } else if (itemToDelete.type === 'session') {
      const updated = deletedSessions.filter(s => s.id !== itemToDelete.id);
      localStorage.setItem('deletedSessions', JSON.stringify(updated));
      setDeletedSessions(updated);
    } else if (itemToDelete.type === 'archive') {
      const updated = deletedArchive.filter(t => t.id !== itemToDelete.id);
      localStorage.setItem('deletedArchive', JSON.stringify(updated));
      setDeletedArchive(updated);
    } else if (itemToDelete.type === 'timetable') {
      const allTimetables = JSON.parse(localStorage.getItem('timetables') || '[]') as Timetable[];
      const updated = allTimetables.filter(t => t.id !== itemToDelete.id);
      localStorage.setItem('timetables', JSON.stringify(updated));
      setDeletedTimetables(updated.filter(t => t.deletedAt));
    }

    toast.success('Permanently deleted');
    setPermanentDeleteDialog(false);
    setItemToDelete(null);
  };

  const formatDuration = (minutes: number) => {
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Recently Deleted</h1>
          <p className="text-muted-foreground">Items are permanently deleted after 30 days</p>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">Tasks ({deletedTasks.length})</TabsTrigger>
            <TabsTrigger value="sessions">Sessions ({deletedSessions.length})</TabsTrigger>
            <TabsTrigger value="archive">Archive ({deletedArchive.length})</TabsTrigger>
            <TabsTrigger value="timetables">Timetables ({deletedTimetables.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 mt-4">
            {deletedTasks.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No deleted tasks
              </Card>
            ) : (
              deletedTasks.map(task => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{task.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Deleted {formatDistanceToNow(new Date(task.deletedAt!))} ago</span>
                        <Badge variant="outline">{getDaysRemaining(task.deletedAt!)} days left</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRestoreTask(task.id)}>
                        <Undo2 className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setItemToDelete({ type: 'task', id: task.id });
                          setPermanentDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4 mt-4">
            {deletedSessions.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No deleted sessions
              </Card>
            ) : (
              deletedSessions.map(session => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{session.taskName}</h3>
                      {session.description && (
                        <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{formatDuration(session.duration)}</span>
                        <span>{new Date(session.dateEnded).toLocaleDateString('en-GB')}</span>
                        <span>Deleted {formatDistanceToNow(new Date(session.deletedAt!))} ago</span>
                        <Badge variant="outline">{getDaysRemaining(session.deletedAt!)} days left</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRestoreSession(session.id)}>
                        <Undo2 className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setItemToDelete({ type: 'session', id: session.id });
                          setPermanentDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="archive" className="space-y-4 mt-4">
            {deletedArchive.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No deleted archive items
              </Card>
            ) : (
              deletedArchive.map(task => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1 line-through">{task.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{Math.round(task.spentMinutes)}m spent</span>
                        <span>Deleted {formatDistanceToNow(new Date(task.deletedAt!))} ago</span>
                        <Badge variant="outline">{getDaysRemaining(task.deletedAt!)} days left</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRestoreArchive(task.id)}>
                        <Undo2 className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setItemToDelete({ type: 'archive', id: task.id });
                          setPermanentDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="timetables" className="space-y-4 mt-4">
            {deletedTimetables.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No deleted timetables
              </Card>
            ) : (
              deletedTimetables.map(timetable => (
                <Card key={timetable.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{timetable.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'} • {timetable.rows.length} periods
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Deleted {formatDistanceToNow(new Date(timetable.deletedAt!))} ago</span>
                        <Badge variant="outline">{getDaysRemaining(timetable.deletedAt!)} days left</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRestoreTimetable(timetable.id)}>
                        <Undo2 className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setItemToDelete({ type: 'timetable', id: timetable.id });
                          setPermanentDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <AlertDialog open={permanentDeleteDialog} onOpenChange={setPermanentDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Permanently Delete</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This item will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handlePermanentDelete}>Delete Forever</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default RecentlyDeletedUnified;
