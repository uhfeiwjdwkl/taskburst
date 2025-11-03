import { Button } from '@/components/ui/button';
import { FileDown, Upload } from 'lucide-react';
import { exportData } from '@/lib/exportImport';
import { toast } from 'sonner';
import { useRef } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ExportImportRecentlyDeletedButtonProps {
  data: any;
  filename: string;
  onImport: (data: any) => void;
}

export const ExportImportRecentlyDeletedButton = ({ data, filename, onImport }: ExportImportRecentlyDeletedButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData(data, filename);
    toast.success('Data exported successfully!');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      onImport(imported);
      toast.success('Data imported successfully!');
    } catch (error) {
      toast.error('Failed to import. Please check the file format.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Export/Import
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-background">
          <DropdownMenuItem onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            Export
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="hidden"
      />
    </>
  );
};
