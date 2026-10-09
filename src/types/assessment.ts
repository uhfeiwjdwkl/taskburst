import { ResultPart } from '@/lib/resultParts';
export interface AssessmentResultPart extends ResultPart {}

export interface Assessment {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  assessmentType: string; // custom types like "Exam", "Test", "Quiz", etc.
  dueDate: string;
  termId?: string;
  completed: boolean;
  linkedTaskId?: string; // optional link to a study/revision task
  result: {
    notes?: string;
    totalScore: number | null;
    totalMaxScore: number;
    totalMode?: 'marks' | 'average';
    parts: AssessmentResultPart[];
    flagged?: boolean;
  };
  showInResults: boolean;
  resultShortName?: string;
  createdAt: string;
  deletedAt?: string;
}
