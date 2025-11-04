import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Project } from '@/types/project';
import { toast } from 'sonner';

interface ExportProjectButtonProps {
  project: Project;
}

export const ExportProjectButton = ({ project }: ExportProjectButtonProps) => {
  const handleExport = () => {
    const dataStr = JSON.stringify(project, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `project-${project.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Project exported successfully!');
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export
    </Button>
  );
};