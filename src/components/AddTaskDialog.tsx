import { useMemo } from 'react';
import { Task } from '@/types/task';
import TaskDetailsDialog from '@/components/TaskDetailsDialog';
import { ImportTaskButton } from '@/components/ImportTaskButton';

interface AddTaskDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  prefilledDate?: string;
}

const AddTaskDialog = ({ open, onClose, onAdd, prefilledDate }: AddTaskDialogProps) => {
  // Build a fresh blank task each time the dialog opens so all fields reset.
  const blankTask: Task | null = useMemo(() => {
    if (!open) return null;
    return {
      id: `new-${Date.now()}`,
      name: '',
      description: '',
      category: '',
      importance: 2,
      estimatedMinutes: 25,
      spentMinutes: 0,
      dueDate: prefilledDate || '',
      completed: false,
      createdAt: new Date().toISOString(),
      progressGridSize: 0,
      progressGridFilled: 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefilledDate]);

  const handleSave = (task: Task) => {
    if (!task.name.trim()) return;
    const { id: _id, createdAt: _createdAt, ...rest } = task;
    onAdd(rest);
    onClose();
  };

  return (
    <TaskDetailsDialog
      task={blankTask}
      open={open}
      onClose={onClose}
      onSave={handleSave}
      mode="create"
      headerExtra={<ImportTaskButton onImport={onAdd} />}
    />
  );
};

export default AddTaskDialog;
