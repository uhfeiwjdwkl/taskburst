import { addDays } from 'date-fns';
import { Assessment, AssessmentResultPart } from '@/types/assessment';
import { Task, TaskResult } from '@/types/task';

const ASSESSMENTS_KEY = 'assessments';

const defaultParts = (): AssessmentResultPart[] =>
  Array.from({ length: 4 }, (_, index) => ({
    name: `Part ${index + 1}`,
    score: null,
    maxScore: 25,
    notes: '',
  }));

export const createDefaultAssessmentResult = () => ({
  totalScore: null,
  totalMaxScore: 100,
  totalMode: 'marks' as const,
  parts: defaultParts(),
});

const cloneTaskResult = (result?: TaskResult) => {
  if (!result) return createDefaultAssessmentResult();

  return {
    totalScore: result.totalScore ?? null,
    totalMaxScore: result.totalMaxScore || 100,
    totalMode: result.totalMode || 'marks',
    parts:
      result.parts?.length > 0
        ? result.parts.map((part) => ({
            name: part.name,
            score: part.score,
            maxScore: part.maxScore,
            notes: part.notes,
          }))
        : defaultParts(),
  };
};

export const safeParseArray = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

export const getStoredAssessments = (): Assessment[] => safeParseArray<Assessment>(ASSESSMENTS_KEY);

export const saveStoredAssessments = (assessments: Assessment[]) => {
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
};

export const syncAssessmentWithTask = (assessment: Assessment, task: Task): Assessment => ({
  ...assessment,
  linkedTaskId: task.id,
  category: task.category || '',
  result: cloneTaskResult(task.result),
});

export const syncLinkedAssessmentsForTask = (task: Task, assessments = getStoredAssessments()) => {
  let changed = false;

  const syncedAssessments = assessments.map((assessment) => {
    if (assessment.linkedTaskId !== task.id || assessment.deletedAt) return assessment;

    const nextAssessment = syncAssessmentWithTask(assessment, task);
    if (
      assessment.category !== nextAssessment.category ||
      JSON.stringify(assessment.result) !== JSON.stringify(nextAssessment.result)
    ) {
      changed = true;
      return nextAssessment;
    }

    return assessment;
  });

  if (changed) {
    saveStoredAssessments(syncedAssessments);
  }

  return { assessments: syncedAssessments, changed };
};

export const buildLinkedAssessment = (
  task: Task,
  fields: Pick<Assessment, 'id' | 'name' | 'assessmentType' | 'dueDate' | 'completed' | 'showInResults' | 'createdAt'> &
    Partial<Pick<Assessment, 'description' | 'deletedAt' | 'resultShortName'>>
): Assessment => ({
  id: fields.id,
  name: fields.name,
  description: fields.description,
  category: task.category || '',
  assessmentType: fields.assessmentType,
  dueDate: fields.dueDate || task.dueDate || addDays(new Date(), 7).toISOString().slice(0, 10),
  completed: fields.completed,
  linkedTaskId: task.id,
  result: cloneTaskResult(task.result),
  showInResults: fields.showInResults,
  resultShortName: fields.resultShortName,
  createdAt: fields.createdAt,
  deletedAt: fields.deletedAt,
});