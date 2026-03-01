export interface AssessmentResultPart {
  name: string;
  score: number | null;
  maxScore: number;
  notes?: string;
}

export interface Assessment {
  id: string;
  name: string;
  description?: string;
  category: string;
  subcategory?: string;
  assessmentType: string; // custom types like "Exam", "Test", "Quiz", etc.
  dueDate: string;
  completed: boolean;
  linkedTaskId?: string; // optional link to a study/revision task
  result: {
    totalScore: number | null;
    totalMaxScore: number;
    totalMode?: 'marks' | 'average';
    parts: AssessmentResultPart[];
  };
  showInResults: boolean;
  resultShortName?: string;
  createdAt: string;
  deletedAt?: string;
}
