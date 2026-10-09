import { ResultPart } from '@/lib/resultParts';
export interface ProjectResultPart extends ResultPart {}

export interface ProjectResult {
  notes?: string;
  flagged?: boolean;
  totalMode?: 'marks' | 'average';
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
