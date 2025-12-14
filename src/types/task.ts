import { Subtask } from './subtask';

export interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  importance: number; // 1-5 scale
  estimatedMinutes: number;
  spentMinutes: number;
  dueDate: string;
  completed: boolean;
  createdAt: string;
  progressGridSize: number; // Total number of squares in the grid
  progressGridFilled: number; // Number of filled squares
  deletedAt?: string; // ISO string - when moved to recently deleted
  instructions?: string; // Optional instructions/guidelines for the task
  projectId?: string; // Optional reference to a project
  subtasks?: Subtask[]; // Array of subtasks
}

export type TimerPhase = 'focus' | 'break';

export interface TimerState {
  phase: TimerPhase;
  remainingSeconds: number;
  isRunning: boolean;
  activeTaskId: string | null;
}
