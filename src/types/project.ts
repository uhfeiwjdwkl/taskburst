export interface ProjectResultPart {
  name: string;
  score: number | null;
  maxScore: number;
  notes?: string;
}

export interface ProjectResult {
  totalScore: number | null;
  totalMaxScore: number;
  parts: ProjectResultPart[];
}

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
  // Results fields
  showInResults?: boolean;
  resultShortName?: string;
  result?: ProjectResult;
}
