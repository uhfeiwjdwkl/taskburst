import { Task } from '@/types/task';
import { loadPartialSlots, savePartialSlots } from '@/lib/partialSchedule';
const readArray = (key: string): any[] => {
  try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
};
export const deleteStoredEntity = (key: 'tasks' | 'archivedTasks' | 'calendarEvents', id: string) => {
  const items = readArray(key);
  const item = items.find(item => item.id === id);
  if (!item) return;
  const deletedKey = key === 'calendarEvents' ? 'deletedEvents' : 'deletedTasks';
  localStorage.setItem(deletedKey, JSON.stringify([...readArray(deletedKey).filter(item => item.id !== id), { ...item, deletedAt: new Date().toISOString() }]));
  localStorage.setItem(key, JSON.stringify(items.filter(item => item.id !== id)));
  if (key !== 'calendarEvents') savePartialSlots(loadPartialSlots().filter(slot => slot.itemId !== id && !(item.subtasks || []).some((subtask: { id: string }) => subtask.id === slot.itemId)));
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new Event('calendarEventsUpdated'));
};
export const removeSubtask = (task: Task, subtaskId: string): Task => {
  const subtask = task.subtasks?.find(item => item.id === subtaskId);
  if (!subtask) return task;
  localStorage.setItem('deletedSubtasks', JSON.stringify([...readArray('deletedSubtasks').filter(item => item.id !== subtaskId), { ...subtask, taskId: task.id, deletedAt: new Date().toISOString() }]));
  savePartialSlots(loadPartialSlots().filter(slot => slot.itemId !== subtaskId));
  let progressGridFilled = task.progressGridFilled;
  if (subtask.linkedToProgressGrid && subtask.progressGridIndex !== undefined) {
    try {
      const data = JSON.parse(localStorage.getItem('progressGridFilledIndices') || '{}');
      const indices: number[] = Array.isArray(data[task.id]) ? data[task.id] : [];
      data[task.id] = indices.filter(index => index !== subtask.progressGridIndex);
      localStorage.setItem('progressGridFilledIndices', JSON.stringify(data));
      if (subtask.completed || indices.includes(subtask.progressGridIndex)) progressGridFilled = Math.max(0, progressGridFilled - 1);
    } catch { /* Preserve other progress when storage cannot be parsed. */ }
  }
  return { ...task, progressGridFilled, subtasks: (task.subtasks || []).filter(item => item.id !== subtaskId) };
};
