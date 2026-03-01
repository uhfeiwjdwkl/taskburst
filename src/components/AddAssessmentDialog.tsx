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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, X, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface AddAssessmentDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => void;
  prefilledDate?: string;
}

export const AddAssessmentDialog = ({ open, onClose, onAdd, prefilledDate }: AddAssessmentDialogProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [assessmentType, setAssessmentType] = useState('');
  const [dueDate, setDueDate] = useState(prefilledDate || '');
  const [linkedTaskId, setLinkedTaskId] = useState('');
  const [partCount, setPartCount] = useState(4);
  const [assessmentTypes, setAssessmentTypes] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newType, setNewType] = useState('');
  const [showAddType, setShowAddType] = useState(false);

  useEffect(() => {
    if (open) {
      // Load assessment types
      const savedTypes = localStorage.getItem('assessmentTypes');
      if (savedTypes) {
        setAssessmentTypes(JSON.parse(savedTypes));
      } else {
        const defaults = ['Exam', 'Test', 'Quiz', 'Assignment', 'Presentation', 'Project', 'Practical'];
        setAssessmentTypes(defaults);
        localStorage.setItem('assessmentTypes', JSON.stringify(defaults));
      }

      // Load categories
      const savedCats = localStorage.getItem('categories');
      if (savedCats) setCategories(JSON.parse(savedCats));

      // Load tasks for linking
      const savedTasks = localStorage.getItem('tasks');
      if (savedTasks) setTasks(JSON.parse(savedTasks));

      if (prefilledDate) setDueDate(prefilledDate);
    }
  }, [open, prefilledDate]);

  const handleAddType = () => {
    if (newType.trim() && !assessmentTypes.includes(newType.trim())) {
      const updated = [...assessmentTypes, newType.trim()];
      setAssessmentTypes(updated);
      localStorage.setItem('assessmentTypes', JSON.stringify(updated));
      setAssessmentType(newType.trim());
      setNewType('');
      setShowAddType(false);
    }
  };

  const handleAdd = () => {
    if (!name.trim() || !assessmentType) return;

    const parts: AssessmentResultPart[] = Array.from({ length: partCount }, (_, i) => ({
      name: `Part ${i + 1}`,
      score: null,
      maxScore: 25,
    }));

    onAdd({
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      assessmentType,
      dueDate,
      completed: false,
      linkedTaskId: linkedTaskId || undefined,
      result: {
        totalScore: null,
        totalMaxScore: 100,
        totalMode: 'marks',
        parts,
      },
      showInResults: true,
      resultShortName: '',
    });

    // Reset
    setName('');
    setDescription('');
    setCategory('');
    setAssessmentType('');
    setDueDate('');
    setLinkedTaskId('');
    setPartCount(4);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Assessment</DialogTitle>
          <DialogDescription>Create a new assessment to track results</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Assessment Name *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" placeholder="e.g. Maths Final Exam" autoFocus />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label>Type *</Label>
              <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => setShowAddType(!showAddType)}>
                <Settings className="h-3 w-3 mr-1" />
                Manage
              </Button>
            </div>
            {showAddType && (
              <div className="flex gap-2 mb-2">
                <Input placeholder="New type" value={newType} onChange={(e) => setNewType(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddType()} />
                <Button size="sm" onClick={handleAddType}>Add</Button>
              </div>
            )}
            <Select value={assessmentType} onValueChange={setAssessmentType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {assessmentTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1" placeholder="Optional description..." />
          </div>

          <div>
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>Link to Task (optional)</Label>
            <Select value={linkedTaskId} onValueChange={setLinkedTaskId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="No linked task" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {tasks.filter(t => !t.completed).map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Number of Parts</Label>
            <Input type="number" min="1" max="20" value={partCount} onChange={(e) => setPartCount(parseInt(e.target.value) || 4)} className="mt-1" />
          </div>

          <div className="pt-4 flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-gradient-primary" disabled={!name.trim() || !assessmentType}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assessment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
