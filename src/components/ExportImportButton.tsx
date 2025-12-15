import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import { exportData, importData, mergeImportedData } from '@/lib/exportImport';
import { toast } from 'sonner';

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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
    fileInputRef.current?.click();
    setShowOptions(false);
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

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the drop zone entirely
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
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
    <div 
      className="relative" 
      ref={dropdownRef}
      onDragEnter={handleDragEnter}
    >
      {isDragging && (
        <div
          ref={dropZoneRef}
          className="fixed inset-0 bg-primary/10 border-2 border-dashed border-primary z-50 flex items-center justify-center"
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="bg-background p-8 rounded-lg shadow-lg text-center">
            <Upload className="h-12 w-12 mx-auto text-primary mb-4" />
            <p className="text-lg font-medium">Drop JSON file to import</p>
            <p className="text-sm text-muted-foreground">Will merge with existing data</p>
          </div>
        </div>
      )}
      
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
  );
};