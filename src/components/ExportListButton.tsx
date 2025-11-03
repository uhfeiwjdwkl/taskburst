import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { exportData } from '@/lib/exportImport';
import { toast } from 'sonner';
import { List } from '@/types/list';

interface ExportListButtonProps {
  list: List;
}

export const ExportListButton = ({ list }: ExportListButtonProps) => {
  const handleExport = () => {
    exportData(list, `list-${list.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`);
    toast.success('List exported successfully!');
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <FileDown className="h-4 w-4 mr-2" />
      Export List
    </Button>
  );
};
