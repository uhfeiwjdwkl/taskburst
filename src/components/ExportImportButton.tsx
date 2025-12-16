import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload, X } from 'lucide-react';
import { exportData, importData, mergeImportedData } from '@/lib/exportImport';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExportImportButtonProps {
  data: any;
  filename: string;
  onImport: (data: any) => void;
  storageKey: string;
  label?: string;
  mergeOnImport?: boolean;
}

export const ExportImportButton = ({ data, filename, onImport, storageKey, label, mergeOnImport = true }: ExportImportButtonProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  const handleExport = () => {
    exportData(data, filename);
    toast.success('Data exported successfully!');
    setShowOptions(false);
  };

  const handleImportClick = () => {
    setShowOptions(false);
    setShowImportDialog(true);
  };

  const processImportedFile = async (file: File) => {
    try {
      const importedData = await importData(file);
      
      if (mergeOnImport && Array.isArray(importedData)) {
        // Merge with existing data instead of replacing
        const existingData = JSON.parse(localStorage.getItem(storageKey) || '[]');
        const mergedData = mergeImportedData(existingData, importedData);
        localStorage.setItem(storageKey, JSON.stringify(mergedData));
        onImport(mergedData);
        toast.success(`Imported ${importedData.length} items (merged with existing data)`);
      } else {
        localStorage.setItem(storageKey, JSON.stringify(importedData));
        onImport(importedData);
        toast.success('Data imported successfully!');
      }
      setShowImportDialog(false);
    } catch (error) {
      toast.error('Failed to import data. Please check the file format.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processImportedFile(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Drag and drop handlers for the dialog drop zone
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        await processImportedFile(file);
      } else {
        toast.error('Please drop a JSON file');
      }
    }
  }, [storageKey, onImport, mergeOnImport]);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowOptions(!showOptions)}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          {label ? `Export/Import ${label}` : 'Export/Import'}
        </Button>
        
        {showOptions && (
          <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-50 min-w-[140px]">
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

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import {label || 'Data'}</DialogTitle>
          </DialogHeader>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-primary bg-primary/10' : 'border-border'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <p className="text-lg font-medium mb-2">
              {isDragging ? 'Drop file here' : 'Drag and drop JSON file'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">or</p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Data will be merged with existing items
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};