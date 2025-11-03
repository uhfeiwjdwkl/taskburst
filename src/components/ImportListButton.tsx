import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { importData } from '@/lib/exportImport';
import { toast } from 'sonner';
import { List } from '@/types/list';

interface ImportListButtonProps {
  onImport: (list: Omit<List, 'id' | 'createdAt' | 'order'>) => void;
}

export const ImportListButton = ({ onImport }: ImportListButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importData(file);
      
      // Validate list data
      if (data && typeof data === 'object' && 'title' in data && Array.isArray(data.items)) {
        onImport(data);
        toast.success('List imported successfully!');
      } else {
        toast.error('Invalid list file. Please upload a valid list JSON file.');
      }
    } catch (error) {
      toast.error('Failed to import list. Please check the file format.');
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
        Import List
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
