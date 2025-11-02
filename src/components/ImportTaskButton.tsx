import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { importData } from '@/lib/exportImport';
import { toast } from 'sonner';
import { Task } from '@/types/task';

interface ImportTaskButtonProps {
  onImport: (task: Omit<Task, 'id' | 'createdAt'>) => void;
}

export const ImportTaskButton = ({ onImport }: ImportTaskButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedTask = await importData(file);
      const { id, createdAt, ...taskData } = importedTask;
      onImport(taskData);
      toast.success('Task imported successfully!');
    } catch (error) {
      toast.error('Failed to import task. Please check the file format.');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4 mr-2" />
        Import Task
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};
