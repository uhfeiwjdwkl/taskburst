import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Session } from '@/types/session';
import { Timetable } from '@/types/timetable';
import { List, ListItem } from '@/types/list';
import { Project } from '@/types/project';
import { TextBackup, getTextBackups, deleteTextBackup, clearTextBackups } from '@/lib/textBackup';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Undo2, Trash2, Copy, FileText, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { ExportImportRecentlyDeletedButton } from '@/components/ExportImportRecentlyDeletedButton';
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
  const [deletedLists, setDeletedLists] = useState<List[]>([]);
  const [deletedListItems, setDeletedListItems] = useState<(ListItem & { listId: string; deletedAt?: string })[]>([]);
  const [deletedProjects, setDeletedProjects] = useState<Project[]>([]);
  const [textBackups, setTextBackups] = useState<TextBackup[]>([]);
  const [selectedTextBackups, setSelectedTextBackups] = useState<Set<string>>(new Set());
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

    // Load deleted lists
    const lists = JSON.parse(localStorage.getItem('lists') || '[]') as List[];
    const deletedL = lists.filter(l => l.deletedAt && getDaysRemaining(l.deletedAt) > 0)
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
    setDeletedLists(deletedL);

    // Load deleted list items
    const listItems = JSON.parse(localStorage.getItem('deletedListItems') || '[]') as (ListItem & { listId: string; deletedAt?: string })[];
    const deletedLI = listItems.filter(item => item.deletedAt && getDaysRemaining(item.deletedAt) > 0)
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
    setDeletedListItems(deletedLI);

    // Load deleted projects
    const projects = JSON.parse(localStorage.getItem('projects') || '[]') as Project[];
    const deletedP = projects.filter(p => p.deletedAt && getDaysRemaining(p.deletedAt) > 0)
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
    setDeletedProjects(deletedP);

    // Load text backups
    const backups = getTextBackups();
    setTextBackups(backups.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
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
    } else if (itemToDelete.type === 'list') {
      const allLists = JSON.parse(localStorage.getItem('lists') || '[]') as List[];
      const updated = allLists.filter(l => l.id !== itemToDelete.id);
      localStorage.setItem('lists', JSON.stringify(updated));
      setDeletedLists(updated.filter(l => l.deletedAt));
    } else if (itemToDelete.type === 'list-item') {
      const updated = deletedListItems.filter(item => item.id !== itemToDelete.id);
      localStorage.setItem('deletedListItems', JSON.stringify(updated));
      setDeletedListItems(updated);
    } else if (itemToDelete.type === 'project') {
      const allProjects = JSON.parse(localStorage.getItem('projects') || '[]') as Project[];
      const updated = allProjects.filter(p => p.id !== itemToDelete.id);
      localStorage.setItem('projects', JSON.stringify(updated));
      setDeletedProjects(updated.filter(p => p.deletedAt));
    }

    toast.success('Permanently deleted');
    setPermanentDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleRestoreList = (listId: string) => {
    const list = deletedLists.find(l => l.id === listId);
    if (list) {
      const { deletedAt, ...cleanList } = list;
      const allLists = JSON.parse(localStorage.getItem('lists') || '[]') as List[];
      const updated = allLists.map(l => l.id === listId ? cleanList : l);
      localStorage.setItem('lists', JSON.stringify(updated));
      loadAllDeleted();
      toast.success('List restored');
    }
  };

  const handleRestoreListItem = (itemId: string) => {
    const item = deletedListItems.find(i => i.id === itemId);
    if (item) {
      const { deletedAt, listId, ...cleanItem } = item;
      const allLists = JSON.parse(localStorage.getItem('lists') || '[]') as List[];
      const updated = allLists.map(l => {
        if (l.id === listId) {
          return { ...l, items: [...l.items, cleanItem] };
        }
        return l;
      });
      localStorage.setItem('lists', JSON.stringify(updated));
      
      const updatedDeleted = deletedListItems.filter(i => i.id !== itemId);
      localStorage.setItem('deletedListItems', JSON.stringify(updatedDeleted));
      loadAllDeleted();
      toast.success('List item restored');
    }
  };

  const handleRestoreProject = (projectId: string) => {
    const project = deletedProjects.find(p => p.id === projectId);
    if (project) {
      const { deletedAt, ...cleanProject } = project;
      const allProjects = JSON.parse(localStorage.getItem('projects') || '[]') as Project[];
      const updated = allProjects.map(p => p.id === projectId ? cleanProject : p);
      localStorage.setItem('projects', JSON.stringify(updated));
      loadAllDeleted();
      toast.success('Project restored');
    }
  };

  const formatDuration = (minutes: number) => {
    const m = Math.floor(minutes);
    const s = Math.round((minutes - m) * 60);
    return `${m}m ${s}s`;
  };

  const handleCopyTextBackup = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Text copied to clipboard');
  };

  const handleDeleteTextBackup = (backupId: string) => {
    deleteTextBackup(backupId);
    setTextBackups(textBackups.filter(b => b.id !== backupId));
    setSelectedTextBackups(prev => {
      const next = new Set(prev);
      next.delete(backupId);
      return next;
    });
    toast.success('Text backup deleted');
  };

  const handleToggleTextBackupSelection = (backupId: string) => {
    setSelectedTextBackups(prev => {
      const next = new Set(prev);
      if (next.has(backupId)) {
        next.delete(backupId);
      } else {
        next.add(backupId);
      }
      return next;
    });
  };

  const handleSelectAllTextBackups = () => {
    if (selectedTextBackups.size === textBackups.length) {
      setSelectedTextBackups(new Set());
    } else {
      setSelectedTextBackups(new Set(textBackups.map(b => b.id)));
    }
  };

  const handleBulkDeleteTextBackups = () => {
    selectedTextBackups.forEach(id => deleteTextBackup(id));
    setTextBackups(textBackups.filter(b => !selectedTextBackups.has(b.id)));
    setSelectedTextBackups(new Set());
    toast.success(`Deleted ${selectedTextBackups.size} text backups`);
  };

  const handleBulkCopyTextBackups = () => {
    const selectedBackups = textBackups.filter(b => selectedTextBackups.has(b.id));
    const content = selectedBackups.map(b => `[${b.sourceName} - ${b.fieldLabel}]\n${b.previousContent}`).join('\n\n---\n\n');
    navigator.clipboard.writeText(content);
    toast.success(`Copied ${selectedTextBackups.size} text backups to clipboard`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Recently Deleted</h1>
          <p className="text-muted-foreground">Items are permanently deleted after 30 days</p>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="tasks">Tasks ({deletedTasks.length})</TabsTrigger>
            <TabsTrigger value="sessions">Sessions ({deletedSessions.length})</TabsTrigger>
            <TabsTrigger value="archive">Archive ({deletedArchive.length})</TabsTrigger>
            <TabsTrigger value="timetables">Timetables ({deletedTimetables.length})</TabsTrigger>
            <TabsTrigger value="lists">Lists ({deletedLists.length})</TabsTrigger>
            <TabsTrigger value="list-items">List Items ({deletedListItems.length})</TabsTrigger>
            <TabsTrigger value="projects">Projects ({deletedProjects.length})</TabsTrigger>
            <TabsTrigger value="text-backups" className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Text ({textBackups.length})
            </TabsTrigger>
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

          <TabsContent value="lists" className="space-y-4 mt-4">
            {deletedLists.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No deleted lists
              </Card>
            ) : (
              deletedLists.map(list => (
                <Card key={list.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{list.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{list.items.length} items</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Deleted {formatDistanceToNow(new Date(list.deletedAt!))} ago</span>
                        <Badge variant="outline">{getDaysRemaining(list.deletedAt!)} days left</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRestoreList(list.id)}>
                        <Undo2 className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setItemToDelete({ type: 'list', id: list.id });
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

          <TabsContent value="list-items" className="space-y-4 mt-4">
            {deletedListItems.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No deleted list items
              </Card>
            ) : (
              deletedListItems.map(item => (
                <Card key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Priority: {item.priority}</span>
                        <span>Deleted {formatDistanceToNow(new Date(item.deletedAt!))} ago</span>
                        <Badge variant="outline">{getDaysRemaining(item.deletedAt!)} days left</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRestoreListItem(item.id)}>
                        <Undo2 className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setItemToDelete({ type: 'list-item', id: item.id });
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

          <TabsContent value="projects" className="space-y-4 mt-4">
            {deletedProjects.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No deleted projects
              </Card>
            ) : (
              deletedProjects.map(project => (
                <Card key={project.id} className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{project.title}</h3>
                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{project.taskIds.length} tasks</span>
                        <span>Deleted {formatDistanceToNow(new Date(project.deletedAt!))} ago</span>
                        <Badge variant="outline">{getDaysRemaining(project.deletedAt!)} days left</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleRestoreProject(project.id)}>
                        <Undo2 className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setItemToDelete({ type: 'project', id: project.id });
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

          <TabsContent value="text-backups" className="space-y-4 mt-4">
            {textBackups.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllTextBackups}
                >
                  <CheckSquare className="h-4 w-4 mr-1" />
                  {selectedTextBackups.size === textBackups.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selectedTextBackups.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBulkCopyTextBackups}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Selected ({selectedTextBackups.size})
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteTextBackups}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete Selected ({selectedTextBackups.size})
                    </Button>
                  </>
                )}
              </div>
            )}
            {textBackups.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                No text backups. Text backups are created when you edit and save text fields.
              </Card>
            ) : (
              textBackups.map(backup => (
                <Card key={backup.id} className={cn("p-4", selectedTextBackups.has(backup.id) && "ring-2 ring-primary")}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTextBackups.has(backup.id)}
                        onChange={() => handleToggleTextBackupSelection(backup.id)}
                        className="mt-1.5 h-4 w-4 rounded border-border"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{backup.sourceName}</h3>
                          <Badge variant="outline">{backup.sourceType}</Badge>
                          <Badge variant="secondary">{backup.fieldLabel}</Badge>
                        </div>
                        <div className="text-sm bg-muted p-3 rounded-md max-h-32 overflow-y-auto whitespace-pre-wrap">
                          {backup.previousContent || <span className="italic text-muted-foreground">(empty)</span>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span>Saved {formatDistanceToNow(new Date(backup.savedAt))} ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleCopyTextBackup(backup.previousContent)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteTextBackup(backup.id)}
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
