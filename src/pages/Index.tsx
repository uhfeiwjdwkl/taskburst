import { useState, useEffect, useMemo } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { CalendarEvent } from '@/types/event';
import { Timetable, FlexibleEvent } from '@/types/timetable';
import { List } from '@/types/list';
import { Project } from '@/types/project';
import Timer from '@/components/Timer';
import TaskCard from '@/components/TaskCard';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import TaskDetailsViewDialog from '@/components/TaskDetailsViewDialog';
import AddTaskDialog from '@/components/AddTaskDialog';
import { TimetableCurrentBlock } from '@/components/TimetableCurrentBlock';
import { CurrentEventDisplay } from '@/components/CurrentEventDisplay';
import { CurrentScheduledTask } from '@/components/CurrentScheduledTask';
import { UniversalDayCalendar } from '@/components/UniversalDayCalendar';
import { ExportImportButton } from '@/components/ExportImportButton';
import { exportAllData } from '@/lib/exportImport';
import { ImportAllButton } from '@/components/ImportAllButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Archive, Calendar, FolderOpen, History as HistoryIcon, Table, Star, List as ListIcon, Download, Briefcase, ChevronDown, ChevronRight, GripVertical, Search, Trash2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { playTaskCompleteSound } from '@/lib/sounds';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { formatDateTimeToDDMMYYYY } from '@/lib/dateFormat';
import { ListCard } from '@/components/ListCard';
import { ListDetailsDialog } from '@/components/ListDetailsDialog';
import { SubtaskFullDetailsDialog } from '@/components/SubtaskFullDetailsDialog';
import EventDetailsViewDialog from '@/components/EventDetailsViewDialog';
import { FlexibleEventDetailsDialog } from '@/components/FlexibleEventDetailsDialog';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const Index = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [favoriteTimetables, setFavoriteTimetables] = useState<Timetable[]>([]);
  const [favoriteLists, setFavoriteLists] = useState<List[]>([]);
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [selectedList, setSelectedList] = useState<List | null>(null);
  const [listDetailsOpen, setListDetailsOpen] = useState(false);
  const [selectedSubtask, setSelectedSubtask] = useState<{ subtask: Subtask; task: Task } | null>(null);
  const [subtaskDetailsOpen, setSubtaskDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [selectedTimetableEvent, setSelectedTimetableEvent] = useState<FlexibleEvent | null>(null);
  const [timetableEventDetailsOpen, setTimetableEventDetailsOpen] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  // Load tasks from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      try {
        const loadedTasks = JSON.parse(savedTasks);
        if (!Array.isArray(loadedTasks)) throw new Error('Not array');
        const migratedTasks = loadedTasks.map((task: Task, index: number) => ({
          ...task,
          progressGridSize: task.progressGridSize ?? 10,
          progressGridFilled: task.progressGridFilled ?? 0,
          order: task.order ?? index,
        }));
        setTasks(migratedTasks);
      } catch (e) {
        console.error('Failed to parse tasks:', e);
      }
    } else {
      const sampleTask: Task = {
        id: '1',
        name: 'Welcome to TaskBurst! 🎯',
        description: 'Click the Study button to start a 25-minute work session. Edit this task or add your own!',
        category: 'Study',
        importance: 3,
        estimatedMinutes: 25,
        spentMinutes: 0,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completed: false,
        createdAt: new Date().toISOString(),
        progressGridSize: 10,
        progressGridFilled: 0,
        order: 0,
      };
      setTasks([sampleTask]);
      localStorage.setItem('tasks', JSON.stringify([sampleTask]));
    }
    setTasksLoaded(true);
  }, []);

  // Load favorite timetables
  useEffect(() => {
    const safeParse = (key: string): any[] => {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    };

    setFavoriteTimetables(safeParse('timetables').filter((t: Timetable) => t.favorite && !t.deletedAt));
    setFavoriteLists(safeParse('lists').filter((l: List) => l.favorite && !l.deletedAt && !l.archivedAt));
    setActiveProjects(safeParse('projects').filter((p: Project) => !p.deletedAt && !p.archivedAt));
  }, []);

  // Save tasks to localStorage only after initial load
  useEffect(() => {
    if (tasksLoaded) {
      localStorage.setItem('tasks', JSON.stringify(tasks));
    }
  }, [tasks, tasksLoaded]);

  // Note: Task selection is now manual via Study button - no auto-selection

  // Update task progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTasks(prev => [...prev]);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddTask = (newTask: Omit<Task, 'id' | 'createdAt'>) => {
    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      order: tasks.length,
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

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const deletedTask = { ...task, deletedAt: new Date().toISOString() };
      const deleted = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
      localStorage.setItem('deletedTasks', JSON.stringify([...deleted, deletedTask]));
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task moved to recently deleted');
      
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }
    }
  };

  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const completedTask = { ...task, completed: true };
      
      // Play completion sound
      playTaskCompleteSound();
      
      // Move to archive
      const archived = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
      localStorage.setItem('archivedTasks', JSON.stringify([...archived, completedTask]));
      
      // Remove from active tasks
      setTasks(tasks.filter(t => t.id !== taskId));
      
      // Fire confetti
      const confetti = (window as any).confetti;
      if (confetti) {
        confetti({
          particleCount: 200,
          spread: 70,
          origin: { y: 0.6 },
          zIndex: 9999,
        });
      }
      
      toast.success('Task completed and archived! 🎉');
      
      // Clear active task if it was this one
      if (activeTaskId === taskId) {
        setActiveTaskId(null);
      }
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

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(sortedTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order property for all tasks
    const updatedTasks = items.map((task, index) => ({ ...task, order: index }));
    setTasks(updatedTasks);
  };

  // Sort tasks by manual order first, then by importance and due date
  const sortedTasks = [...tasks].sort((a, b) => {
    // If both have order, use that
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    // Otherwise fall back to importance and due date
    if (b.importance !== a.importance) {
      return b.importance - a.importance;
    }
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return sortedTasks;
    const q = searchQuery.toLowerCase();
    return sortedTasks.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    );
  }, [sortedTasks, searchQuery]);

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleSelectAllTasks = () => {
    if (selectedTaskIds.size === filteredTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(filteredTasks.map(t => t.id)));
    }
  };

  const handleBulkComplete = () => {
    const toComplete = tasks.filter(t => selectedTaskIds.has(t.id));
    const archived = JSON.parse(localStorage.getItem('archivedTasks') || '[]');
    localStorage.setItem('archivedTasks', JSON.stringify([...archived, ...toComplete.map(t => ({ ...t, completed: true }))]));
    setTasks(tasks.filter(t => !selectedTaskIds.has(t.id)));
    toast.success(`${toComplete.length} tasks completed and archived!`);
    setSelectedTaskIds(new Set());
    setSelectionMode(false);
  };

  const handleBulkDelete = () => {
    const toDelete = tasks.filter(t => selectedTaskIds.has(t.id));
    const deleted = JSON.parse(localStorage.getItem('deletedTasks') || '[]');
    localStorage.setItem('deletedTasks', JSON.stringify([...deleted, ...toDelete.map(t => ({ ...t, deletedAt: new Date().toISOString() }))]));
    setTasks(tasks.filter(t => !selectedTaskIds.has(t.id)));
    toast.success(`${toDelete.length} tasks moved to recently deleted`);
    setSelectedTaskIds(new Set());
    setSelectionMode(false);
  };

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  return (
    <div className="min-h-screen bg-background relative">
      {/* Dimming overlay when timer is running */}
      {timerRunning && (
        <div className="fixed inset-0 bg-black/60 z-40 pointer-events-none" />
      )}
      
      <div className="container max-w-6xl mx-auto px-4 py-8 relative z-0">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Focus Timer
            </h1>
            <p className="text-muted-foreground mt-1">Stay productive with Pomodoro technique</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportAllData}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export All
            </Button>
            <ImportAllButton onImport={() => window.location.reload()} />
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="bg-gradient-primary hover:opacity-90 shadow-glow"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Task
            </Button>
          </div>
        </header>

        {/* Timer Section with Day Calendar */}
        <section className="grid lg:grid-cols-[1fr,400px] gap-6 mb-8">
          {/* Timer */}
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border relative z-50 pointer-events-auto">
            <TimetableCurrentBlock />
            <CurrentScheduledTask tasks={tasks} />
            <CurrentEventDisplay />
            <Timer
              onTick={handleTimerTick} 
              activeTaskId={activeTaskId} 
              activeTask={activeTask}
              onTaskComplete={handleCompleteTask}
              onRunningChange={setTimerRunning}
              onUpdateTask={handleUpdateTask}
              tasks={tasks}
              onSelectTask={setActiveTaskId}
            />
          </div>

          {/* Day Calendar - shown beside timer on large screens */}
          <div className="hidden lg:block h-[550px]">
            <UniversalDayCalendar
              tasks={tasks}
              onTaskClick={(task) => {
                setSelectedTask(task);
                setDetailsDialogOpen(true);
              }}
              onSubtaskClick={(subtask, task) => {
                setSelectedSubtask({ subtask, task });
                setSubtaskDetailsOpen(true);
              }}
              onEventClick={(event) => {
                setSelectedEvent(event);
                setEventDetailsOpen(true);
              }}
              onAssessmentClick={() => navigate('/results')}
              onTimetableEventClick={(event) => {
                setSelectedTimetableEvent(event);
                setTimetableEventDetailsOpen(true);
              }}
              onStartSubtask={(subtask, task) => {
                setActiveTaskId(task.id);
                toast.success(`Starting focus session for: ${subtask.title}`);
              }}
            />
          </div>
        </section>

        {/* Day Calendar - shown above tasks on smaller screens */}
        <section className="lg:hidden mb-6">
            <UniversalDayCalendar
              tasks={tasks}
              onTaskClick={(task) => {
                setSelectedTask(task);
                setDetailsDialogOpen(true);
              }}
              onSubtaskClick={(subtask, task) => {
                setSelectedSubtask({ subtask, task });
                setSubtaskDetailsOpen(true);
              }}
              onEventClick={(event) => {
                setSelectedEvent(event);
                setEventDetailsOpen(true);
              }}
              onAssessmentClick={() => navigate('/results')}
              onTimetableEventClick={(event) => {
                setSelectedTimetableEvent(event);
                setTimetableEventDetailsOpen(true);
              }}
              onStartSubtask={(subtask, task) => {
                setActiveTaskId(task.id);
                toast.success(`Starting focus session for: ${subtask.title}`);
              }}
            />
        </section>

        {/* Tasks Section with Drag & Drop */}
        <section>
          <div className="flex flex-col gap-3 mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Your Tasks ({filteredTasks.length})
                {!selectionMode && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    Drag to reorder
                  </span>
                )}
              </h2>
              <Button
                variant={selectionMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => { setSelectionMode(!selectionMode); setSelectedTaskIds(new Set()); }}
              >
                {selectionMode ? 'Cancel' : 'Select'}
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {selectionMode && selectedTaskIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAllTasks}>
                  {selectedTaskIds.size === filteredTasks.length ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-muted-foreground">{selectedTaskIds.size} selected</span>
                <div className="ml-auto flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleBulkComplete} className="gap-1">
                    <CheckCircle className="h-4 w-4" /> Complete
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            )}
          </div>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="tasks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {filteredTasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index} isDragDisabled={selectionMode}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? 'opacity-80' : ''}
                        >
                          <div className="flex gap-2 items-start">
                            {selectionMode ? (
                              <div className="mt-4 p-1">
                                <Checkbox
                                  checked={selectedTaskIds.has(task.id)}
                                  onCheckedChange={() => handleToggleTaskSelection(task.id)}
                                />
                              </div>
                            ) : (
                              <div
                                {...provided.dragHandleProps}
                                className="mt-4 p-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                              >
                                <GripVertical className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex-1">
                              <TaskCard
                                task={task}
                                onStartFocus={handleStartFocus}
                                onShowDetails={handleShowDetails}
                                onEdit={handleEdit}
                                onComplete={handleCompleteTask}
                                onDelete={handleDeleteTask}
                                onUpdateTask={handleUpdateTask}
                                onStartSubtask={(subtask, parentTask) => {
                                  setActiveTaskId(parentTask.id);
                                  toast.success(`Starting focus session for: ${subtask.title}`);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>

        {/* Favorite Lists Section */}
        {favoriteLists.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                Favorite Lists
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/lists')}>
                View All
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {favoriteLists.map((list) => (
                <ListCard 
                  key={list.id} 
                  list={list}
                  onClick={() => {
                    setSelectedList(list);
                    setListDetailsOpen(true);
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Favorite Timetables Section */}
        {favoriteTimetables.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                Favorite Timetables
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigate('/timetable')}>
                View All
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {favoriteTimetables.map((timetable) => (
                <Card
                  key={timetable.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate('/timetable')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{timetable.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'} • {timetable.rows.length} periods
                      </p>
                    </div>
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

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
          onUpdateTask={handleUpdateTask}
          onEdit={handleEdit}
        />

        <AddTaskDialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          onAdd={handleAddTask}
        />

        {selectedList && (
          <ListDetailsDialog
            list={selectedList}
            open={listDetailsOpen}
            onClose={() => setListDetailsOpen(false)}
            onUpdate={(updatedList) => {
              const allLists = JSON.parse(localStorage.getItem('lists') || '[]');
              const updated = allLists.map((l: List) => l.id === updatedList.id ? updatedList : l);
              localStorage.setItem('lists', JSON.stringify(updated));
              setFavoriteLists(updated.filter((l: List) => l.favorite && !l.deletedAt && !l.archivedAt));
              toast.success('List updated!');
            }}
            onDelete={() => {
              if (selectedList) {
                const deletedList = { ...selectedList, deletedAt: new Date().toISOString() };
                const allLists = JSON.parse(localStorage.getItem('lists') || '[]');
                localStorage.setItem('lists', JSON.stringify([...allLists.filter((l: List) => l.id !== selectedList.id), deletedList]));
                setFavoriteLists(favoriteLists.filter(l => l.id !== selectedList.id));
                setListDetailsOpen(false);
                toast.success('List moved to recently deleted');
              }
            }}
            onArchive={() => {
              if (selectedList) {
                const archivedList = { ...selectedList, archivedAt: new Date().toISOString() };
                const allLists = JSON.parse(localStorage.getItem('lists') || '[]');
                localStorage.setItem('lists', JSON.stringify([...allLists.filter((l: List) => l.id !== selectedList.id), archivedList]));
                setFavoriteLists(favoriteLists.filter(l => l.id !== selectedList.id));
                setListDetailsOpen(false);
                toast.success('List archived!');
              }
            }}
            onDeleteItem={(itemId) => {
              if (selectedList) {
                const deletedItem = selectedList.items.find(item => item.id === itemId);
                if (deletedItem) {
                  const deletedItems = JSON.parse(localStorage.getItem('deletedListItems') || '[]');
                  localStorage.setItem('deletedListItems', JSON.stringify([...deletedItems, { ...deletedItem, deletedAt: new Date().toISOString(), listId: selectedList.id }]));
                  const updatedList = {
                    ...selectedList,
                    items: selectedList.items.filter(item => item.id !== itemId),
                  };
                  setSelectedList(updatedList);
                  const allLists = JSON.parse(localStorage.getItem('lists') || '[]');
                  const updated = allLists.map((l: List) => l.id === updatedList.id ? updatedList : l);
                  localStorage.setItem('lists', JSON.stringify(updated));
                  setFavoriteLists(updated.filter((l: List) => l.favorite && !l.deletedAt && !l.archivedAt));
                  toast.success('Item moved to recently deleted');
                }
              }
            }}
          />
        )}

        {/* Subtask Details Dialog */}
        <SubtaskFullDetailsDialog
          subtask={selectedSubtask?.subtask || null}
          open={subtaskDetailsOpen && !!selectedSubtask}
            onClose={() => {
              setSubtaskDetailsOpen(false);
              setSelectedSubtask(null);
            }}
            parentTaskName={selectedSubtask?.task.name}
            onGoToParentTask={() => {
              setSubtaskDetailsOpen(false);
              setSelectedTask(selectedSubtask.task);
              setDetailsDialogOpen(true);
              setSelectedSubtask(null);
            }}
            onEdit={() => {
              setSelectedTask(selectedSubtask.task);
              setEditDialogOpen(true);
              setSubtaskDetailsOpen(false);
            }}
            onComplete={() => {
              const updatedSubtasks = (selectedSubtask.task.subtasks || []).map(s =>
                s.id === selectedSubtask.subtask.id ? { ...s, completed: true } : s
              );
              const updatedTask = { ...selectedSubtask.task, subtasks: updatedSubtasks };
              handleUpdateTask(updatedTask);
              setSubtaskDetailsOpen(false);
              setSelectedSubtask(null);
              toast.success('Subtask completed!');
            }}
            onUncomplete={() => {
              const updatedSubtasks = (selectedSubtask.task.subtasks || []).map(s =>
                s.id === selectedSubtask.subtask.id ? { ...s, completed: false } : s
              );
              const updatedTask = { ...selectedSubtask.task, subtasks: updatedSubtasks };
              handleUpdateTask(updatedTask);
              setSubtaskDetailsOpen(false);
              setSelectedSubtask(null);
              toast.success('Subtask marked incomplete');
            }}
          />
        <EventDetailsViewDialog
          event={selectedEvent}
          open={eventDetailsOpen}
          onClose={() => {
            setEventDetailsOpen(false);
            setSelectedEvent(null);
          }}
        />
        <FlexibleEventDetailsDialog
          event={selectedTimetableEvent}
          open={timetableEventDetailsOpen}
          onOpenChange={setTimetableEventDetailsOpen}
          onSave={() => {}}
          onDelete={() => {}}
          readOnly
          onGoToTimetable={() => navigate('/timetable')}
        />
      </div>
    </div>
  );
};

export default Index;
