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

export type TaskType = 'general' | 'study' | 'revision' | 'practice' | 'homework' | 'reading' | 'writing' | 'research';

export const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'study', label: 'Study' },
  { value: 'revision', label: 'Revision' },
  { value: 'practice', label: 'Practice' },
  { value: 'homework', label: 'Homework' },
  { value: 'reading', label: 'Reading' },
  { value: 'writing', label: 'Writing' },
  { value: 'research', label: 'Research' },
];

export interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory?: string; // Optional subcategory within category
  taskType?: TaskType; // Type of task
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