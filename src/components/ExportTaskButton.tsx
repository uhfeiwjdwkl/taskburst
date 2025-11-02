import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportData } from '@/lib/exportImport';
import { toast } from 'sonner';
import { Task } from '@/types/task';

interface ExportTaskButtonProps {
  task: Task;
}

export const ExportTaskButton = ({ task }: ExportTaskButtonProps) => {
  const handleExport = () => {
    exportData(task, `task-${task.name.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.json`);
    toast.success('Task exported successfully!');
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export Task
    </Button>
  );
};
