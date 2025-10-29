export interface Session {
  id: string;
  taskId: string;
  taskName: string;
  description?: string; // User-defined session description
  dateEnded: string; // ISO string
  duration: number; // in minutes
  progressGridStart: number; // number of squares filled at start
  progressGridEnd: number; // number of squares filled at end
  progressGridSize: number; // total grid size
  phase: 'focus' | 'break';
  deletedAt?: string; // ISO string - when moved to recently deleted
}
