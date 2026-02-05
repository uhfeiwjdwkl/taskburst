import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Session } from '@/types/session';
import { Timetable } from '@/types/timetable';
import { List, ListItem } from '@/types/list';
import { Project } from '@/types/project';
import { TextBackup, getTextBackups, deleteTextBackup, clearTextBackups } from '@/lib/textBackup';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Undo2, Trash2, Copy, FileText, CheckSquare, Menu, ChevronDown, Search, RotateCcw } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Tab configuration
const TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'sessions', label: 'Sessions' },
  { id: 'archive', label: 'Archive' },
  { id: 'timetables', label: 'Timetables' },
  { id: 'lists', label: 'Lists' },
  { id: 'list-items', label: 'List Items' },
  { id: 'projects', label: 'Projects' },
  { id: 'text-backups', label: 'Text', icon: FileText },
] as const;

type TabId = typeof TABS[number]['id'];

const RecentlyDeletedUnified = () => {
  const [activeTab, setActiveTab] = useState<TabId>('tasks');
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [textSearchQuery, setTextSearchQuery] = useState('');

  useEffect(() => {
    loadAllDeleted();
    
    // Check width for responsive tabs
    const checkWidth = () => {
      setIsCollapsed(window.innerWidth < 768);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const loadAllDeleted = () => {
    const tasks = JSON.parse(localStorage.getItem('deletedTasks') || '[]') as Task[];
    setDeletedTasks(tasks.filter(t => getDaysRemaining(t.deletedAt!) > 0).sort((a, b) => 
      new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
    ));

    const sessions = JSON.parse(localStorage.getItem('deletedSessions') || '[]') as Session[];
    setDeletedSessions(sessions.filter(s => getDaysRemaining(s.deletedAt!) > 0).sort((a, b) => 
      new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
    ));

    const archive = JSON.parse(localStorage.getItem('deletedArchive') || '[]') as Task[];
    setDeletedArchive(archive.filter(t => getDaysRemaining(t.deletedAt!) > 0).sort((a, b) => 
      new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime()
    ));

    const timetables = JSON.parse(localStorage.getItem('timetables') || '[]') as Timetable[];
    const deletedTT = timetables.filter(t => t.deletedAt && getDaysRemaining(t.deletedAt) > 0)
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
    setDeletedTimetables(deletedTT);

    const lists = JSON.parse(localStorage.getItem('lists') || '[]') as List[];
    const deletedL = lists.filter(l => l.deletedAt && getDaysRemaining(l.deletedAt) > 0)
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
    setDeletedLists(deletedL);

    const listItems = JSON.parse(localStorage.getItem('deletedListItems') || '[]') as (ListItem & { listId: string; deletedAt?: string })[];
    const deletedLI = listItems.filter(item => item.deletedAt && getDaysRemaining(item.deletedAt) > 0)
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
    setDeletedListItems(deletedLI);

    const projects = JSON.parse(localStorage.getItem('projects') || '[]') as Project[];
    const deletedP = projects.filter(p => p.deletedAt && getDaysRemaining(p.deletedAt) > 0)
      .sort((a, b) => new Date(b.deletedAt!).getTime() - new Date(a.deletedAt!).getTime());
    setDeletedProjects(deletedP);

    const backups = getTextBackups();
    setTextBackups(backups.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()));
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const expiryDate = new Date(deleted.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    return Math.max(0, Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const getTabCount = (tabId: TabId): number => {
    switch (tabId) {
      case 'tasks': return deletedTasks.length;
      case 'sessions': return deletedSessions.length;
      case 'archive': return deletedArchive.length;
      case 'timetables': return deletedTimetables.length;
      case 'lists': return deletedLists.length;
      case 'list-items': return deletedListItems.length;
      case 'projects': return deletedProjects.length;
      case 'text-backups': return textBackups.length;
      default: return 0;
    }
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

  const handleRestoreTextToField = (backup: TextBackup) => {
    // Restore text directly to the source item's field
    const { sourceType, sourceId, fieldLabel } = backup;
    
    try {
      let storageKey = '';
      let items: any[] = [];
      
      switch (sourceType) {
        case 'task':
          storageKey = 'tasks';
          items = JSON.parse(localStorage.getItem(storageKey) || '[]');
          // Also check archived tasks
          const archivedTasks = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
          const taskIndex = items.findIndex((t: any) => t.id === sourceId);
          const archivedIndex = archivedTasks.findIndex((t: any) => t.id === sourceId);
          
          if (taskIndex !== -1) {
            const fieldKey = fieldLabel.toLowerCase() as keyof Task;
            items[taskIndex][fieldKey] = backup.previousContent;
            localStorage.setItem(storageKey, JSON.stringify(items));
          } else if (archivedIndex !== -1) {
            const fieldKey = fieldLabel.toLowerCase() as keyof Task;
            archivedTasks[archivedIndex][fieldKey] = backup.previousContent;
            localStorage.setItem('archivedTasks', JSON.stringify(archivedTasks));
          } else {
            toast.error('Source item not found');
            return;
          }
          break;
          
        case 'project':
          storageKey = 'projects';
          items = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const projectIndex = items.findIndex((p: any) => p.id === sourceId);
          if (projectIndex !== -1) {
            const fieldKey = fieldLabel.toLowerCase() as keyof Project;
            items[projectIndex][fieldKey] = backup.previousContent;
            localStorage.setItem(storageKey, JSON.stringify(items));
          } else {
            toast.error('Source project not found');
            return;
          }
          break;
          
        case 'list':
          storageKey = 'lists';
          items = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const listIndex = items.findIndex((l: any) => l.id === sourceId);
          if (listIndex !== -1) {
            const fieldKey = fieldLabel.toLowerCase() as keyof List;
            items[listIndex][fieldKey] = backup.previousContent;
            localStorage.setItem(storageKey, JSON.stringify(items));
          } else {
            toast.error('Source list not found');
            return;
          }
          break;
          
        case 'event':
          storageKey = 'events';
          items = JSON.parse(localStorage.getItem(storageKey) || '[]');
          const eventIndex = items.findIndex((e: any) => e.id === sourceId);
          if (eventIndex !== -1) {
            const fieldKey = fieldLabel.toLowerCase();
            items[eventIndex][fieldKey] = backup.previousContent;
            localStorage.setItem(storageKey, JSON.stringify(items));
          } else {
            toast.error('Source event not found');
            return;
          }
          break;
          
        default:
          toast.error('Cannot restore to this item type');
          return;
      }
      
      toast.success(`Restored "${fieldLabel}" to ${sourceType}`);
      // Delete the backup after restoring
      deleteTextBackup(backup.id);
      setTextBackups(textBackups.filter(b => b.id !== backup.id));
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore text');
    }
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
  // Filter text backups by search query
  const filteredTextBackups = textSearchQuery.trim()
    ? textBackups.filter(b => 
        b.sourceName.toLowerCase().includes(textSearchQuery.toLowerCase()) ||
        b.fieldLabel.toLowerCase().includes(textSearchQuery.toLowerCase()) ||
        b.previousContent.toLowerCase().includes(textSearchQuery.toLowerCase()) ||
        b.sourceType.toLowerCase().includes(textSearchQuery.toLowerCase())
      )
    : textBackups;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tasks':
        return deletedTasks.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No deleted tasks</Card>
        ) : (
          deletedTasks.map(task => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{task.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Deleted {formatDistanceToNow(new Date(task.deletedAt!))} ago</span>
                    <Badge variant="outline">{getDaysRemaining(task.deletedAt!)} days left</Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
        );

      case 'sessions':
        return deletedSessions.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No deleted sessions</Card>
        ) : (
          deletedSessions.map(session => (
            <Card key={session.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{session.taskName}</h3>
                  {session.description && (
                    <p className="text-sm text-muted-foreground mb-2">{session.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatDuration(session.duration)}</span>
                    <span>{new Date(session.dateEnded).toLocaleDateString('en-GB')}</span>
                    <span>Deleted {formatDistanceToNow(new Date(session.deletedAt!))} ago</span>
                    <Badge variant="outline">{getDaysRemaining(session.deletedAt!)} days left</Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
        );

      case 'archive':
        return deletedArchive.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No deleted archive items</Card>
        ) : (
          deletedArchive.map(task => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 line-through">{task.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{Math.round(task.spentMinutes)}m spent</span>
                    <span>Deleted {formatDistanceToNow(new Date(task.deletedAt!))} ago</span>
                    <Badge variant="outline">{getDaysRemaining(task.deletedAt!)} days left</Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
        );

      case 'timetables':
        return deletedTimetables.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No deleted timetables</Card>
        ) : (
          deletedTimetables.map(timetable => (
            <Card key={timetable.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{timetable.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'} • {timetable.rows.length} periods
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Deleted {formatDistanceToNow(new Date(timetable.deletedAt!))} ago</span>
                    <Badge variant="outline">{getDaysRemaining(timetable.deletedAt!)} days left</Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
        );

      case 'lists':
        return deletedLists.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No deleted lists</Card>
        ) : (
          deletedLists.map(list => (
            <Card key={list.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{list.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{list.items.length} items</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Deleted {formatDistanceToNow(new Date(list.deletedAt!))} ago</span>
                    <Badge variant="outline">{getDaysRemaining(list.deletedAt!)} days left</Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
        );

      case 'list-items':
        return deletedListItems.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No deleted list items</Card>
        ) : (
          deletedListItems.map(item => (
            <Card key={item.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>Priority: {item.priority}</span>
                    <span>Deleted {formatDistanceToNow(new Date(item.deletedAt!))} ago</span>
                    <Badge variant="outline">{getDaysRemaining(item.deletedAt!)} days left</Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
        );

      case 'projects':
        return deletedProjects.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No deleted projects</Card>
        ) : (
          deletedProjects.map(project => (
            <Card key={project.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{project.title}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{project.taskIds.length} tasks</span>
                    <span>Deleted {formatDistanceToNow(new Date(project.deletedAt!))} ago</span>
                    <Badge variant="outline">{getDaysRemaining(project.deletedAt!)} days left</Badge>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
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
        );

      case 'text-backups':
        return (
          <>
            {/* Search bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search text backups..."
                value={textSearchQuery}
                onChange={(e) => setTextSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {textBackups.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
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
                      Copy ({selectedTextBackups.size})
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDeleteTextBackups}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete ({selectedTextBackups.size})
                    </Button>
                  </>
                )}
              </div>
            )}
            {filteredTextBackups.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                {textSearchQuery ? 'No text backups match your search.' : 'No text backups. Text backups are created when you edit and save text fields.'}
              </Card>
            ) : (
              filteredTextBackups.map(backup => (
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
                        <div className="flex flex-wrap items-center gap-2 mb-1">
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
                    <div className="flex gap-2 flex-shrink-0">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleRestoreTextToField(backup)}
                        title="Restore to original field"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Restore
                      </Button>
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
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Recently Deleted</h1>
          <p className="text-muted-foreground">Items are permanently deleted after 30 days</p>
        </div>

        {/* Responsive Tab Navigation */}
        <div className="mb-6">
          {isCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Menu className="h-4 w-4" />
                    {TABS.find(t => t.id === activeTab)?.label} ({getTabCount(activeTab)})
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-background">
                {TABS.map((tab) => (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={activeTab === tab.id ? 'bg-secondary' : ''}
                  >
                    <span className="flex items-center gap-2 w-full">
                      {'icon' in tab && tab.icon && <tab.icon className="h-4 w-4" />}
                      {tab.label}
                      <Badge variant="outline" className="ml-auto text-xs">
                        {getTabCount(tab.id)}
                      </Badge>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex flex-wrap gap-2">
              {TABS.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab(tab.id)}
                  className="gap-2"
                >
                  {'icon' in tab && tab.icon && <tab.icon className="h-4 w-4" />}
                  {tab.label}
                  <Badge variant={activeTab === tab.id ? 'secondary' : 'outline'} className="text-xs">
                    {getTabCount(tab.id)}
                  </Badge>
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {renderTabContent()}
        </div>

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
