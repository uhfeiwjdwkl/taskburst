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
}

export type TimerPhase = 'focus' | 'break';

export interface TimerState {
  phase: TimerPhase;
  remainingSeconds: number;
  isRunning: boolean;
  activeTaskId: string | null;
}
