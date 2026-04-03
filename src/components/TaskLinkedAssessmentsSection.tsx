import { useEffect, useMemo, useState } from 'react';
import { Assessment } from '@/types/assessment';
import { Task } from '@/types/task';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { buildLinkedAssessment, getStoredAssessments, saveStoredAssessments, syncAssessmentWithTask, syncLinkedAssessmentsForTask } from '@/lib/assessmentUtils';
import { Calendar, Pencil, Plus, Trash2, Unlink, X } from 'lucide-react';
import { toast } from 'sonner';

interface TaskLinkedAssessmentsSectionProps {
  task: Task;
}

interface AssessmentDraft {
  name: string;
  description: string;
  assessmentType: string;
  dueDate: string;
  completed: boolean;
  showInResults: boolean;
}

const createDraft = (task: Task, assessment?: Assessment): AssessmentDraft => ({
  name: assessment?.name || `${task.name} Assessment`,
  description: assessment?.description || '',
  assessmentType: assessment?.assessmentType || 'Exam',
  dueDate: assessment?.dueDate || task.dueDate || '',
  completed: assessment?.completed || false,
  showInResults: assessment?.showInResults ?? (task.showInResults ?? true),
});

const getTotalDisplay = (assessment: Assessment) => {
  const scoredParts = assessment.result.parts.filter((part) => part.score !== null);
  if (scoredParts.length === 0) return 'No score';
  if (assessment.result.totalMode === 'average') {
    const average = scoredParts.reduce((sum, part) => sum + ((part.score || 0) / part.maxScore) * 100, 0) / scoredParts.length;
    return `${average.toFixed(1)}% avg`;
  }
  const total = scoredParts.reduce((sum, part) => sum + (part.score || 0), 0);
  const max = scoredParts.reduce((sum, part) => sum + part.maxScore, 0);
  return `${total}/${max}`;
};

export const TaskLinkedAssessmentsSection = ({ task }: TaskLinkedAssessmentsSectionProps) => {
  const [linkedAssessments, setLinkedAssessments] = useState<Assessment[]>([]);
  const [editingAssessmentId, setEditingAssessmentId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AssessmentDraft>(createDraft(task));
  const [editorOpen, setEditorOpen] = useState(false);

  const loadAssessments = () => {
    const { assessments } = syncLinkedAssessmentsForTask(task);
    setLinkedAssessments(assessments.filter((assessment) => assessment.linkedTaskId === task.id && !assessment.deletedAt));
  };

  useEffect(() => {
    loadAssessments();
  }, [task]);

  const syncedAssessments = useMemo(() => linkedAssessments.map((assessment) => syncAssessmentWithTask(assessment, task)), [linkedAssessments, task]);

  const closeEditor = () => {
    setEditingAssessmentId(null);
    setDraft(createDraft(task));
    setEditorOpen(false);
  };

  const persistAssessments = (nextAssessments: Assessment[]) => {
    saveStoredAssessments(nextAssessments);
    setLinkedAssessments(nextAssessments.filter((assessment) => assessment.linkedTaskId === task.id && !assessment.deletedAt));
  };

  const handleSaveAssessment = () => {
    if (!draft.name.trim() || !draft.assessmentType.trim()) return;
    const storedAssessments = getStoredAssessments();
    const nextAssessment = buildLinkedAssessment(task, {
      id: editingAssessmentId || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: draft.name.trim(),
      description: draft.description.trim() || undefined,
      assessmentType: draft.assessmentType.trim(),
      dueDate: draft.dueDate,
      completed: draft.completed,
      showInResults: draft.showInResults,
      createdAt: storedAssessments.find((assessment) => assessment.id === editingAssessmentId)?.createdAt || new Date().toISOString(),
    });
    const nextAssessments = editingAssessmentId
      ? storedAssessments.map((assessment) => (assessment.id === editingAssessmentId ? { ...nextAssessment, deletedAt: undefined } : assessment))
      : [...storedAssessments, nextAssessment];
    persistAssessments(nextAssessments);
    closeEditor();
    toast.success(editingAssessmentId ? 'Linked assessment updated' : 'Linked assessment created');
  };

  const handleUnlinkAssessment = (assessment: Assessment) => {
    const storedAssessments = getStoredAssessments();
    const detachedAssessment = syncAssessmentWithTask(assessment, task);
    persistAssessments(storedAssessments.map((item) => (item.id === assessment.id ? { ...detachedAssessment, linkedTaskId: undefined } : item)));
    toast.success('Assessment unlinked from task');
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    const storedAssessments = getStoredAssessments();
    persistAssessments(storedAssessments.map((assessment) => (assessment.id === assessmentId ? { ...assessment, deletedAt: new Date().toISOString() } : assessment)));
    if (editingAssessmentId === assessmentId) closeEditor();
    toast.success('Linked assessment deleted');
  };

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-medium">Linked Assessments</Label>
          <p className="text-xs text-muted-foreground mt-1">Name, type, due date and description are editable here; category and results stay synced to the task.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => { setEditingAssessmentId(null); setDraft(createDraft(task)); setEditorOpen(true); }}>
          <Plus className="h-3 w-3 mr-1" />Add linked
        </Button>
      </div>

      {syncedAssessments.length === 0 && !editorOpen && <Card className="p-3 text-sm text-muted-foreground">No linked assessments yet.</Card>}

      <div className="space-y-2">
        {syncedAssessments.map((assessment) => (
          <Card key={assessment.id} className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium truncate">{assessment.name}</span>
                  <Badge variant="outline">{assessment.assessmentType}</Badge>
                  {assessment.completed && <Badge variant="secondary">Completed</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{assessment.dueDate || 'No due date'}</span>
                  <span>{getTotalDisplay(assessment)}</span>
                </div>
                {assessment.description && <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">{assessment.description}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setEditingAssessmentId(assessment.id); setDraft(createDraft(task, assessment)); setEditorOpen(true); }}><Pencil className="h-3 w-3" /></Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleUnlinkAssessment(assessment)}><Unlink className="h-3 w-3" /></Button>
                <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDeleteAssessment(assessment.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {editorOpen && (
        <Card className="p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-sm font-medium">{editingAssessmentId ? 'Edit linked assessment' : 'Create linked assessment'}</Label>
            <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={closeEditor}><X className="h-3 w-3" /></Button>
          </div>
          <div><Label>Name</Label><Input value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} className="mt-1" /></div>
          <div><Label>Assessment Type</Label><Input value={draft.assessmentType} onChange={(event) => setDraft((current) => ({ ...current, assessmentType: event.target.value }))} className="mt-1" placeholder="Exam, test, quiz..." /></div>
          <div><Label>Due Date</Label><Input type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} className="mt-1" /></div>
          <div><Label>Description</Label><Textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="mt-1 min-h-[90px]" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2"><Checkbox id={`linked-assessment-results-${task.id}`} checked={draft.showInResults} onCheckedChange={(checked) => setDraft((current) => ({ ...current, showInResults: !!checked }))} /><Label htmlFor={`linked-assessment-results-${task.id}`}>Show in results</Label></div>
            <div className="flex items-center gap-2"><Checkbox id={`linked-assessment-completed-${task.id}`} checked={draft.completed} onCheckedChange={(checked) => setDraft((current) => ({ ...current, completed: !!checked }))} /><Label htmlFor={`linked-assessment-completed-${task.id}`}>Completed</Label></div>
          </div>
          <div className="rounded-md border p-2 text-xs text-muted-foreground">This linked assessment inherits the task category and result breakdown automatically.</div>
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={closeEditor}>Cancel</Button><Button type="button" onClick={handleSaveAssessment} className="bg-gradient-primary" disabled={!draft.name.trim() || !draft.assessmentType.trim()}>Save linked assessment</Button></div>
        </Card>
      )}
    </div>
  );
};