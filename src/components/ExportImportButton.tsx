import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { exportData, importData } from '@/lib/exportImport';
import { toast } from 'sonner';

interface ExportImportButtonProps {
  data: any;
  filename: string;
  onImport: (data: any) => void;
  storageKey: string;
}

export const ExportImportButton = ({ data, filename, onImport, storageKey }: ExportImportButtonProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    exportData(data, filename);
    toast.success('Data exported successfully!');
    setShowOptions(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setShowOptions(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedData = await importData(file);
      localStorage.setItem(storageKey, JSON.stringify(importedData));
      onImport(importedData);
      toast.success('Data imported successfully!');
    } catch (error) {
      toast.error('Failed to import data. Please check the file format.');
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Export/Import
      </Button>
      
      {showOptions && (
        <div 
          className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[140px]"
          onMouseEnter={() => setShowOptions(true)}
          onMouseLeave={() => setShowOptions(false)}
        >
          <button
            onClick={handleExport}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 rounded-t-md"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={handleImportClick}
            className="w-full px-4 py-2 text-left text-sm hover:bg-accent flex items-center gap-2 rounded-b-md"
          >
            <Upload className="h-4 w-4" />
            Import
          </button>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
