import { TimeCalculator } from './TimeCalculator';
import { Switch } from '@/components/ui/switch';
import { useState, useEffect } from 'react';
import { Task } from '@/types/task';
import { Subtask } from '@/types/subtask';
import { CalendarEvent } from '@/types/event';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalDayCalendar } from '@/components/UniversalDayCalendar';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns';

import { PartialSlot, loadPartialSlots, savePartialSlots } from '@/lib/partialSchedule';

interface TaskScheduleDialogProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  events?: CalendarEvent[];
}

export const TaskScheduleDialog = ({ task, open, onClose, onSave, events = [] }: TaskScheduleDialogProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);
  const [partial, setPartial] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [partialSlots, setPartialSlots] = useState<PartialSlot[]>([]);
  const [form, setForm] = useState({ date: '', time: '', duration: 30 });

  useEffect(() => { if (open) setPartialSlots(loadPartialSlots()); }, [open]);
  
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  useEffect(() => {
    if (open) {
      // Load all events for the day view
      const savedEvents = localStorage.getItem('calendarEvents');
      if (savedEvents) {
        try { setAllEvents(JSON.parse(savedEvents)); } catch { setAllEvents([]); }
      }
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) {
        try { setAllTasks(JSON.parse(savedTasks)); } catch { setAllTasks([]); }
      }
    }
  }, [open]);

  // Auto-save on close
  const handleClose = () => {
    if (editedTask) {
      onSave(editedTask);
    }
    onClose();
  };

  if (!task || !editedTask) return null;

  const subtasks = editedTask.subtasks || [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  const daysToShow = viewMode === 'month' 
    ? eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) })
    : eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getSubtasksForDay = (date: Date): Subtask[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return subtasks.filter(s => s.dueDate === dateStr);
  };

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => {
      if (e.endDate) {
        return dateStr >= e.date && dateStr <= e.endDate;
      }
      return e.date === dateStr;
    });
  };

  // Get all calendar events for a day (from all events, not just task-related)
  const getAllEventsForDay = (date: Date): CalendarEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allEvents.filter(e => {
      if (e.endDate) return dateStr >= e.date && dateStr <= e.endDate;
      return e.date === dateStr;
    });
  };

  // Get all subtasks across all tasks for a specific day  
  const getAllSubtasksForDay = (date: Date): Subtask[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const result: Subtask[] = [];
    allTasks.forEach(t => {
      (t.subtasks || []).forEach(s => {
        if (s.dueDate === dateStr) result.push(s);
      });
    });
    // Also include this task's subtasks
    subtasks.forEach(s => {
      if (s.dueDate === dateStr && !result.find(r => r.id === s.id)) {
        result.push(s);
      }
    });
    return result;
  };

  // Get tasks due on a specific day
  const getTasksForDay = (date: Date): Task[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return allTasks.filter(t => t.dueDate === dateStr);
  };

  const handleScheduleSubtask = (subtaskId: string, date: Date | null, time?: string, duration?: number) => {
    const updatedSubtasks = subtasks.map(s => 
      s.id === subtaskId 
        ? { 
            ...s, 
            dueDate: date ? format(date, 'yyyy-MM-dd') : undefined, 
            scheduledTime: date ? (time !== undefined ? time : s.scheduledTime) : undefined,
            estimatedMinutes: duration !== undefined ? duration : s.estimatedMinutes
          }
        : s
    );
    setEditedTask({ ...editedTask, subtasks: updatedSubtasks });
  };

  const handleSave = () => {
    onSave(editedTask);
    onClose();
  };

  const navigatePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    }
  };

  const selectedSubtask = subtasks.find(s => s.id === selectedSubtaskId);
  // The day-calendar snapshot reads tasks from storage, which does not yet
  // contain the in-progress edits for this task — merge them in so the
  // subtasks being scheduled actually appear in the preview.
  const mergedTasks: Task[] = (() => {
    const others = allTasks.filter(t => t.id !== editedTask.id);
    return [editedTask, ...others];
  })();
  const usingSubtask = !!selectedSubtask;
  const targetItemId = (usingSubtask ? selectedSubtaskId : task?.id) || '';
  const targetItemType: 'task' | 'subtask' = usingSubtask ? 'subtask' : 'task';
  const targetItemTitle = usingSubtask ? (selectedSubtask?.title || '') : task.name;
  const itemSlots = partialSlots.filter(p => p.itemId === targetItemId);

  const itemFormFor = (id: string | null) => {
    const item = id ? subtasks.find(s => s.id === id) : null;
    const dueDate = item ? item.dueDate : editedTask.scheduledDate?.slice(0, 10);
    const date = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : (dueDate || '');
    return { date, time: (item ? item.scheduledTime : editedTask.scheduledTime) || '', duration: (item ? item.estimatedMinutes : editedTask.estimatedMinutes) || 30 };
  };
  const writeSchedule = (id: string | null, f: { date: string; time: string; duration: number }) => {
    if (id) handleScheduleSubtask(id, f.date ? new Date(f.date + 'T12:00:00') : null, f.date ? f.time : '', f.duration);
    else setEditedTask({ ...editedTask, scheduledDate: f.date || undefined, scheduledTime: f.date && f.time ? f.time : undefined, estimatedMinutes: f.duration, partial: false } as Task);
  };
  const selectItem = (id: string | null) => {
    setSelectedSlotId(null);
    setSelectedSubtaskId(id);
    setPartial(false);
    const f = itemFormFor(id);
    setForm(f);

  };
  const applyForm = (f: { date: string; time: string; duration: number }) => {
    setForm(f);
    if (selectedSlotId) {
      const next = f.date ? partialSlots.map(p => p.id === selectedSlotId ? { ...p, date: f.date, time: f.time, duration: f.duration } : p) : partialSlots.filter(p => p.id !== selectedSlotId);
      setPartialSlots(next); savePartialSlots(next);
      if (!f.date) setSelectedSlotId(null);
    } else if (!partial) writeSchedule(selectedSubtaskId, f);
  };
  const selectSlot = (slot: PartialSlot) => {
    setSelectedSlotId(slot.id); setSelectedSubtaskId(slot.itemType === 'subtask' ? slot.itemId : null);
    setSelectedDate(new Date(slot.date + 'T12:00:00')); setPartial(true);
    setForm({ date: slot.date, time: slot.time, duration: slot.duration });
  };
  const slotCount = (id: string) => partialSlots.filter(p => p.itemId === id).length;

  const addPartialSlot = () => {
    if (!form.date || !form.time) return;
    const slot: PartialSlot = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      itemId: targetItemId,
      itemType: targetItemType,
      itemTitle: targetItemTitle,
      date: form.date,
      time: form.time,
      duration: form.duration || 30,
    };
    const next = [...partialSlots, slot];
    setPartialSlots(next); savePartialSlots(next);
    if (selectedSubtask) setEditedTask({ ...editedTask, subtasks: subtasks.map(s => s.id === selectedSubtask.id ? { ...s, partial: true } : s) });
  };
  const removePartialSlot = (id: string) => {
    const next = partialSlots.filter(p => p.id !== id);
    setPartialSlots(next); savePartialSlots(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule - {task.name}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-w-0">
          <div className="space-y-4 min-w-0">
          {/* Calendar Header */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-center text-sm">
                {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
              </span>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <TimeCalculator />
              <Button
                variant={viewMode === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('month')}
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
            {daysToShow.map(day => {
              const daySubtasks = getSubtasksForDay(day);
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] p-1 border rounded cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/10' : 'border-border'
                  } ${!isCurrentMonth && viewMode === 'month' ? 'opacity-50' : ''} ${
                    isToday(day) ? 'bg-accent/50' : ''
                  }`}
                  onClick={() => { setSelectedDate(day); setForm(f => ({ ...f, date: format(day, 'yyyy-MM-dd') })); }}
                >
                  <div className="text-xs font-medium mb-1">{format(day, 'd')}</div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 1).map(event => (
                      <div key={event.id} className="text-xs bg-blue-500/20 text-blue-700 dark:text-blue-300 px-1 rounded truncate">
                        {event.title}
                      </div>
                    ))}
                    {daySubtasks.slice(0, 2).map(subtask => (
                      <div
                        key={subtask.id}
                        className={`text-xs px-1 rounded truncate cursor-pointer ${
                          subtask.completed ? 'bg-green-500/20 text-green-700 dark:text-green-300 line-through' : 'bg-primary/20 text-primary'
                        } ${selectedSubtaskId === subtask.id ? 'ring-1 ring-primary' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(day); selectItem(subtask.id);
                        }}
                      >
                        {subtask.scheduledTime && <span className="mr-1">{subtask.scheduledTime}</span>}
                        {subtask.title}
                      </div>
                    ))}
                    {(daySubtasks.length > 2 || dayEvents.length > 1) && (
                      <div className="text-xs text-muted-foreground">
                        +{Math.max(0, daySubtasks.length - 2) + Math.max(0, dayEvents.length - 1)} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          </div>
          <div className="space-y-4 min-w-0">
          {/* Day Schedule View */}
          {selectedDate && (
            <div className="h-[350px]">
              <UniversalDayCalendar
                date={selectedDate}
                tasks={mergedTasks}
                onDateChange={(d) => setSelectedDate(d)}
                showCard={false}
                onSubtaskClick={(subtask) => selectItem(subtask.id)}
                onTaskClick={() => selectItem(null)}
                onPartialSlotClick={selectSlot}
              />
            </div>
          )}

          {/* Scheduling bank */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Scheduling bank</h4>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedSubtaskId === null ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => selectItem(null)}
              >
                Whole task: {task.name}{slotCount(task.id) ? ` · ${slotCount(task.id)} partial` : ''}
              </Badge>
              {subtasks.filter(s => !s.dueDate || s.partial).map(subtask => (
                <Badge
                  key={subtask.id}
                  variant={selectedSubtaskId === subtask.id ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => selectItem(subtask.id)}
                >
                  {subtask.title}{slotCount(subtask.id) ? ` · ${slotCount(subtask.id)} partial` : ''}
                </Badge>
              ))}
            </div>
            {subtasks.length > 0 && subtasks.every(s => s.dueDate && !s.partial) && (
              <p className="text-sm text-muted-foreground mt-2">All subtasks are scheduled</p>
            )}
          </div>

          {/* Selected day */}
          {selectedDate && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">{format(selectedDate, 'EEEE, MMMM d, yyyy')}</h4>
              <div className="space-y-2 max-h-[180px] overflow-y-auto">
                {getEventsForDay(selectedDate).map(event => (
                  <div key={event.id} className="p-2 bg-muted/60 rounded text-sm">
                    <span className="font-medium">{event.title}</span>
                    {event.time && <span className="text-muted-foreground ml-2">{event.time}</span>}
                  </div>
                ))}
                {getSubtasksForDay(selectedDate).map(subtask => (
                  <div key={subtask.id} className={`flex items-center justify-between p-2 bg-muted rounded cursor-pointer ${selectedSubtaskId === subtask.id ? 'ring-1 ring-primary' : ''}`} onClick={() => selectItem(subtask.id)}>
                    <span className={subtask.completed ? 'line-through' : ''}>{subtask.title}{subtask.scheduledTime && <span className="text-muted-foreground text-sm ml-2">{subtask.scheduledTime}</span>}</span>
                    <Button type="button" variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleScheduleSubtask(subtask.id, null); }}>Unschedule</Button>
                  </div>
                ))}
                {partialSlots.filter(p => p.date === format(selectedDate, 'yyyy-MM-dd') && (p.itemId === task.id || subtasks.some(s => s.id === p.itemId))).map(slot => (
                  <div key={slot.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm cursor-pointer" onClick={() => selectSlot(slot)}>
                    <span>{slot.itemTitle} <span className="text-muted-foreground ml-1">{slot.time} · {slot.duration}m · partial</span></span>
                    <Button type="button" variant="ghost" size="sm" onClick={e => { e.stopPropagation(); removePartialSlot(slot.id); if (selectedSlotId === slot.id) setSelectedSlotId(null); }}>Unschedule</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single schedule editor */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-medium flex items-center gap-2"><Clock className="h-4 w-4" />Schedule: {targetItemTitle}</h4>
              <Label className="flex items-center gap-2"><Switch checked={partial} disabled={Boolean(selectedSlotId)} onCheckedChange={setPartial} />Partial</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Label className="space-y-1">Date<Input type="date" value={form.date} onChange={e => applyForm({ ...form, date: e.target.value, time: e.target.value ? form.time : '' })} /></Label>
              <Label className="space-y-1">Time<Input type="time" value={form.time} disabled={!form.date} onChange={e => applyForm({ ...form, time: e.target.value })} /></Label>
              <Label className="space-y-1">Duration (min)<Input type="number" min={0} value={form.duration} onChange={e => applyForm({ ...form, duration: Number(e.target.value) || 0 })} /></Label>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => { if (selectedSlotId) removePartialSlot(selectedSlotId); else writeSchedule(selectedSubtaskId, { ...form, date: '', time: '' }); setSelectedSlotId(null); setForm(f => ({ ...f, date: '', time: '' })); }}>Unschedule</Button>
            {partial && !selectedSlotId ? (
              <Button type="button" size="sm" disabled={!form.date || !form.time} onClick={addPartialSlot}>Add partial session</Button>
            ) : (
              <p className="text-xs text-muted-foreground">Changes apply straight away. Turn on Partial to add a session that keeps this item in the bank.</p>
            )}
            {itemSlots.length > 0 && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Partial sessions</p>
                {itemSlots.map(slot => (
                  <div key={slot.id} className="flex justify-between items-center text-sm bg-muted/50 rounded px-2 cursor-pointer" onClick={() => selectSlot(slot)}>
                    <span>{slot.date} · {slot.time} · {slot.duration}m</span>
                    <Button type="button" size="sm" variant="ghost" onClick={e => { e.stopPropagation(); removePartialSlot(slot.id); if (selectedSlotId === slot.id) setSelectedSlotId(null); }}>Unschedule</Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handleClose}>Close</Button>
          <Button onClick={handleSave}>Save Schedule</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
