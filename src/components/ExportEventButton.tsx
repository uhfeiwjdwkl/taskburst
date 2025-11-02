import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportData } from '@/lib/exportImport';
import { toast } from 'sonner';
import { CalendarEvent } from '@/types/event';

interface ExportEventButtonProps {
  event: CalendarEvent;
}

export const ExportEventButton = ({ event }: ExportEventButtonProps) => {
  const handleExport = () => {
    exportData(event, `event-${event.title.replace(/[^a-zA-Z0-9]/g, '_')}-${new Date().toISOString().split('T')[0]}.json`);
    toast.success('Event exported successfully!');
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      Export Event
    </Button>
  );
};
