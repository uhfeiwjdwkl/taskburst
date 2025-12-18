export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  description?: string;
  abbreviation?: string; // Optional abbreviation for display on progress grid
  estimatedMinutes?: number;
  priority?: number; // 1-5, optional
  dueDate?: string; // ISO date string
  scheduledTime?: string; // "09:00" format for time scheduling
  completed: boolean;
  linkedToProgressGrid: boolean; // Whether this subtask corresponds to a progress grid box
  progressGridIndex?: number; // Which grid box this subtask is linked to
  createdAt: string;
  color?: string; // Optional color for the subtask on progress grid
}

export interface ScheduledItem {
  id: string;
  type: 'task' | 'subtask';
  taskId: string;
  subtaskId?: string;
  title: string;
  scheduledDate: string;
  scheduledTime: string;
  duration?: number; // in minutes
  completed: boolean;
  reminded: boolean;
}
