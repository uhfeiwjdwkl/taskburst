import type { Task } from '@/types/task';
import type { Subtask } from '@/types/subtask';

export function normalizeSubtaskSchedule(subtask: Subtask): Subtask {
  return { ...subtask, scheduledTime: subtask.dueDate ? subtask.scheduledTime : undefined };
}
export function duplicateFreshTask(task: Task, id = crypto.randomUUID()): Task {
  return {
    ...task, id, name: `${task.name} (copy)`, createdAt: new Date().toISOString(),
    order: 0, scheduledDate: undefined, scheduledTime: undefined, partial: false,
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

export function deleteProgressBox(task: Task, index: number, filled: number[]) {
  const shift = (i: number) => (i > index ? i - 1 : i);
  const subtasks = (task.subtasks || []).map(s => {
    if (!s.linkedToProgressGrid || s.progressGridIndex === undefined) return s;
    if (s.progressGridIndex === index) return { ...s, linkedToProgressGrid: false, progressGridIndex: undefined };
    return { ...s, progressGridIndex: shift(s.progressGridIndex) };
  });
  const nextFilled = filled.filter(i => i !== index).map(shift);
  return { task: { ...task, subtasks, progressGridSize: Math.max(0, task.progressGridSize - 1), progressGridFilled: nextFilled.length }, filled: nextFilled };
}

/** Complete/uncomplete a subtask and keep its linked progress box in step. */
export function setSubtaskCompleted(task: Task, subtaskId: string, completed: boolean, filled: number[]) {
  const sub = (task.subtasks || []).find(s => s.id === subtaskId);
  let nextFilled = [...filled];
  if (sub?.linkedToProgressGrid && sub.progressGridIndex !== undefined) {
    nextFilled = completed ? Array.from(new Set([...filled, sub.progressGridIndex])).sort((a, b) => a - b) : filled.filter(i => i !== sub.progressGridIndex);
  }
  return {
    task: { ...task, progressGridFilled: sub?.linkedToProgressGrid ? nextFilled.length : task.progressGridFilled, subtasks: (task.subtasks || []).map(s => s.id === subtaskId ? { ...s, completed } : s) },
    filled: nextFilled,
  };
}
