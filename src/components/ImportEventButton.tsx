import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { importData } from '@/lib/exportImport';
import { toast } from 'sonner';
import { CalendarEvent } from '@/types/event';

interface ImportEventButtonProps {
  onImport: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
}

export const ImportEventButton = ({ onImport }: ImportEventButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedEvent = await importData(file);
      const { id, createdAt, ...eventData } = importedEvent;
      onImport(eventData);
      toast.success('Event imported successfully!');
    } catch (error) {
      toast.error('Failed to import event. Please check the file format.');
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
        Import Event
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
