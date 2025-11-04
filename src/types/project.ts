export interface Project {
  id: string;
  title: string;
  description?: string;
  dueDateTime?: string;
  favorite: boolean;
  notes?: string;
  taskIds: string[]; // References to task IDs
  order: number;
  createdAt: string;
  archivedAt?: string;
  deletedAt?: string;
  totalEstimatedMinutes: number;
  totalSpentMinutes: number;
}
