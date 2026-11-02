import type { Task } from '@/types/task';
import type { Subtask } from '@/types/subtask';

export function normalizeSubtaskSchedule(subtask: Subtask): Subtask {
  return { ...subtask, scheduledTime: subtask.dueDate ? subtask.scheduledTime : undefined };
}
export function duplicateFreshTask(task: Task, id = crypto.randomUUID()): Task {
  return {
    ...task, id, name: `${task.name} (copy)`, createdAt: new Date().toISOString(),
    order: 0, dueDate: '', scheduledTime: undefined, partial: false,
    spentMinutes: 0, progressGridFilled: 0, completed: false, archivedAt: undefined, deletedAt: undefined,
    subtasks: (task.subtasks || []).map(s => ({ ...s, id: crypto.randomUUID(), taskId: id,
      dueDate: undefined, scheduledTime: undefined, partial: false, completed: false })),
  };
}
export function moveProgressBox(task: Task, from: number, to: number, filled: number[]) {
  const order = Array.from({ length: task.progressGridSize }, (_, i) => i);
  const [moved] = order.splice(from, 1);
  if (moved === undefined || to < 0 || to >= task.progressGridSize) return { task, filled };
  order.splice(to, 0, moved);
  const subtasks = (task.subtasks || []).map(s => s.linkedToProgressGrid && s.progressGridIndex !== undefined
    ? { ...s, progressGridIndex: order.indexOf(s.progressGridIndex) } : s);
  const linked = subtasks.filter(s => s.linkedToProgressGrid).sort((a, b) => (a.progressGridIndex ?? 0) - (b.progressGridIndex ?? 0));
  let next = 0;
  return { task: { ...task, subtasks: subtasks.map(s => s.linkedToProgressGrid ? linked[next++] : s) }, filled: filled.map(i => order.indexOf(i)).sort((a,b) => a-b) };
}
