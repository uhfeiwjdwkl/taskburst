import { useState, useEffect } from 'react';
import { Assessment, AssessmentResultPart } from '@/types/assessment';
import { Task } from '@/types/task';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Calendar, Edit, ExternalLink, Trash2, Plus, Flag } from 'lucide-react';

interface AssessmentDetailsDialogProps {
  assessment: Assessment | null;
  open: boolean;
  onClose: () => void;
  onSave: (assessment: Assessment) => void;
  onViewLinkedTask?: (taskId: string) => void;
  onDelete?: (id: string) => void;
}

export const AssessmentDetailsDialog = ({
  assessment,
  open,
  onClose,
  onSave,
  onViewLinkedTask,
  onDelete,
}: AssessmentDetailsDialogProps) => {
  const [editing, setEditing] = useState(false);
  const [editedAssessment, setEditedAssessment] = useState<Assessment | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('taskCategories');
    if (saved) {
      try { setCategories(JSON.parse(saved)); } catch { setCategories([]); }
    }
  }, [open]);

  if (!assessment) return null;

  const a = editing ? editedAssessment! : assessment;

  const calculateTotal = () => {
    const mode = a.result.totalMode || 'marks';
    const scored = a.result.parts.filter(p => p.score !== null);
    if (scored.length === 0) return { display: '-', percentage: '-' };

    if (mode === 'average') {
      const totalWeight = scored.reduce((sum, p) => sum + (p.weight ?? 1), 0);
      const avg = scored.reduce((sum, p) => sum + ((p.score || 0) / p.maxScore) * 100 * (p.weight ?? 1), 0) / totalWeight;
      return { display: avg.toFixed(1) + '%', percentage: avg.toFixed(1) + '%' };
    }
    const total = scored.reduce((sum, p) => sum + (p.score || 0), 0);
    const max = scored.reduce((sum, p) => sum + p.maxScore, 0);
    return { display: `${total}/${max}`, percentage: ((total / max) * 100).toFixed(1) + '%' };
  };

  const totals = calculateTotal();
  const daysUntilDue = a.dueDate
    ? Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const handleStartEdit = () => {
    setEditedAssessment({ ...assessment });
    setEditing(true);
  };

  const handleSave = () => {
    if (editedAssessment) {
      onSave(editedAssessment);
      setEditing(false);
    }
  };

  const handlePartChange = (index: number, field: 'score' | 'maxScore' | 'name', value: string) => {
    if (!editedAssessment) return;
    const parts = [...editedAssessment.result.parts];
    if (field === 'score') parts[index] = { ...parts[index], score: value === '' ? null : Number(value) };
    else if (field === 'maxScore') parts[index] = { ...parts[index], maxScore: Number(value) || 25 };
    else parts[index] = { ...parts[index], name: value };
    setEditedAssessment({ ...editedAssessment, result: { ...editedAssessment.result, parts } });
  };

  const handleAddPart = () => {
    if (!editedAssessment) return;
    const newPart: AssessmentResultPart = { name: `Part ${editedAssessment.result.parts.length + 1}`, score: null, maxScore: 25 };
    setEditedAssessment({ ...editedAssessment, result: { ...editedAssessment.result, parts: [...editedAssessment.result.parts, newPart] } });
  };

  const handleRemovePart = (index: number) => {
    if (!editedAssessment || editedAssessment.result.parts.length <= 1) return;
    const parts = editedAssessment.result.parts.filter((_, i) => i !== index);
    setEditedAssessment({ ...editedAssessment, result: { ...editedAssessment.result, parts } });
  };

  const handleTogglePartFlag = (index: number) => {
    if (!editedAssessment) return;
    const parts = [...editedAssessment.result.parts];
    parts[index] = { ...parts[index], flagged: !parts[index].flagged };
    setEditedAssessment({ ...editedAssessment, result: { ...editedAssessment.result, parts } });
  };

  const handleToggleAssessmentFlag = () => {
    if (!editedAssessment) return;
    setEditedAssessment({
      ...editedAssessment,
      result: { ...editedAssessment.result, flagged: !editedAssessment.result.flagged },
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="flex flex-row items-center justify-between">
          <div className={a.result.flagged ? 'text-primary' : ''}>
            <DialogTitle className={a.result.flagged ? 'text-primary' : ''}>{a.name}</DialogTitle>
            <DialogDescription className={a.result.flagged ? 'text-primary' : ''}>{a.assessmentType} • {a.category || 'Uncategorized'}</DialogDescription>
          </div>
          <div className="flex items-center gap-1">
            {editing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleAssessmentFlag}
                className="h-8 w-8 p-0"
                aria-label={a.result.flagged ? 'Unflag assessment' : 'Flag assessment'}
              >
                <Flag className={`h-4 w-4 ${a.result.flagged ? 'fill-primary text-primary' : ''}`} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Editing fields */}
          {editing && editedAssessment && (
            <div className="space-y-3 border rounded-lg p-3">
              <div>
                <Label>Name</Label>
                <Input value={editedAssessment.name} onChange={(e) => setEditedAssessment({ ...editedAssessment, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={editedAssessment.category || ''} onValueChange={(v) => setEditedAssessment({ ...editedAssessment, category: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description</Label>
                <Input value={editedAssessment.description || ''} onChange={(e) => setEditedAssessment({ ...editedAssessment, description: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={editedAssessment.dueDate || ''} onChange={(e) => setEditedAssessment({ ...editedAssessment, dueDate: e.target.value })} className="mt-1" />
              </div>
            </div>
          )}

          {/* Due date & countdown */}
          {!editing && a.dueDate && (
            <div className="flex items-center gap-2">
              <Badge variant={daysUntilDue !== null && daysUntilDue < 0 ? 'destructive' : 'secondary'}>
                <Calendar className="h-3 w-3 mr-1" />
                {new Date(a.dueDate).toLocaleDateString('en-GB')}
              </Badge>
              {daysUntilDue !== null && (
                <Badge variant={daysUntilDue < 0 ? 'destructive' : daysUntilDue <= 7 ? 'outline' : 'secondary'}>
                  {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)}d overdue` : daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue}d`}
                </Badge>
              )}
            </div>
          )}

          {!editing && a.description && <p className="text-sm text-muted-foreground">{a.description}</p>}

          {/* Total + mode toggle */}
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold">{totals.display}</div>
            {totals.percentage !== totals.display && (
              <div className="text-lg text-muted-foreground">{totals.percentage}</div>
            )}
            {editing && editedAssessment && (
              <div className="flex items-center gap-2 justify-center mt-2">
                <Button
                  variant={editedAssessment.result.totalMode === 'marks' || !editedAssessment.result.totalMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEditedAssessment({ ...editedAssessment, result: { ...editedAssessment.result, totalMode: 'marks' } })}
                >
                  Sum
                </Button>
                <Button
                  variant={editedAssessment.result.totalMode === 'average' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEditedAssessment({ ...editedAssessment, result: { ...editedAssessment.result, totalMode: 'average' } })}
                >
                  Average
                </Button>
              </div>
            )}
            {!editing && (
              <Badge variant="outline" className="mt-2 text-xs">
                {a.result.totalMode === 'average' ? 'Avg' : 'Sum'}
              </Badge>
            )}
          </Card>

          {/* Parts */}
          <div className="space-y-2">
            <Label>Result Parts</Label>
            {a.result.parts.map((part, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 border rounded-md ${part.flagged ? 'text-primary' : ''}`}>
                {editing && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleTogglePartFlag(i)}
                    aria-label={part.flagged ? 'Unflag part' : 'Flag part'}
                  >
                    <Flag className={`h-3 w-3 ${part.flagged ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                )}
                {editing ? (
                  <>
                    <Input value={part.name} onChange={(e) => handlePartChange(i, 'name', e.target.value)} className="flex-1 h-8 text-sm" />
                    <Input type="number" value={part.score ?? ''} onChange={(e) => handlePartChange(i, 'score', e.target.value)} placeholder="—" className="w-16 h-8 text-sm" />
                    <span className="text-muted-foreground">/</span>
                    <Input type="number" value={part.maxScore} onChange={(e) => handlePartChange(i, 'maxScore', e.target.value)} className="w-16 h-8 text-sm" />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleRemovePart(i)} disabled={a.result.parts.length <= 1}>
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{part.name}</span>
                    <span className="text-sm font-medium">
                      {part.score !== null ? `${part.score}/${part.maxScore}` : '—'}
                    </span>
                    {part.score !== null && (
                      <Badge variant="outline" className="text-xs">
                        {((part.score / part.maxScore) * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </>
                )}
              </div>
            ))}
            {editing && (
              <Button variant="outline" size="sm" onClick={handleAddPart} className="w-full">
                <Plus className="h-3 w-3 mr-1" /> Add Part
              </Button>
            )}
          </div>

          {/* Linked task */}
          {a.linkedTaskId && onViewLinkedTask && (
            <Button variant="outline" className="w-full" onClick={() => onViewLinkedTask(a.linkedTaskId!)}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Linked Task
            </Button>
          )}
        </div>

        <div className="flex gap-2 justify-end border-t pt-4">
          {onDelete && (
            <Button variant="ghost" className="text-destructive mr-auto" onClick={() => onDelete(a.id)}>
              <Trash2 className="h-4 w-4 mr-1" /> Delete
            </Button>
          )}
          {editing ? (
            <>
              <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
              <Button className="bg-gradient-primary" onClick={handleSave}>Save</Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleStartEdit}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
