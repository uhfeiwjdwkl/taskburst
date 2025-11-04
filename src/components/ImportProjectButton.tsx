import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { Project } from '@/types/project';
import { toast } from 'sonner';

interface ImportProjectButtonProps {
  onImport: (project: Omit<Project, 'id' | 'createdAt' | 'order'>) => void;
}

export const ImportProjectButton = ({ onImport }: ImportProjectButtonProps) => {
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const imported = JSON.parse(text);
        
        // Validate it's a project
        if (imported.title && Array.isArray(imported.taskIds)) {
          onImport(imported);
          toast.success('Project imported successfully!');
        } else {
          toast.error('Invalid project file');
        }
      } catch (error) {
        toast.error('Failed to import project');
      }
    };
    input.click();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleImport}>
      <Upload className="h-4 w-4 mr-2" />
      Import
    </Button>
  );
};