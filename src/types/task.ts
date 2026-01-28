import { Subtask } from './subtask';

export interface TaskResultPart {
  name: string;
  score: number | null;
  maxScore: number;
  notes?: string;
}

export interface TaskResult {
  totalScore: number | null;
  totalMaxScore: number;
  parts: TaskResultPart[];
  totalMode?: 'marks' | 'average'; // marks = sum of parts, average = avg of part percentages
}

export interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string; // Optional subcategory within category
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
  // Results fields
  showInResults?: boolean;
  resultShortName?: string;
  result?: TaskResult;
  // Manual ordering
  order?: number;
}

export type TimerPhase = 'focus' | 'break';

export interface TimerState {
  phase: TimerPhase;
  remainingSeconds: number;
  isRunning: boolean;
  activeTaskId: string | null;
}