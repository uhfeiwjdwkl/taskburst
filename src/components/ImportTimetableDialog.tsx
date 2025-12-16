import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Timetable, TimeSlot, TimetableCell } from '@/types/timetable';
import { toast } from 'sonner';

interface ImportTimetableDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (timetable: Timetable) => void;
}

export const ImportTimetableDialog = ({ open, onClose, onCreate }: ImportTimetableDialogProps) => {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateTemplate = () => {
    // Create a sample timetable template
    const templateData = [
      ['Time Slot', 'Start Time', 'Duration (mins)', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      ['Period 1', '09:00', '60', 'Math', 'English', 'Science', 'History', 'Art'],
      ['Period 2', '10:00', '60', 'English', 'Math', 'PE', 'Geography', 'Music'],
      ['Break', '11:00', '15', '', '', '', '', ''],
      ['Period 3', '11:15', '60', 'Science', 'History', 'Math', 'English', 'Drama'],
      ['Period 4', '12:15', '60', 'PE', 'Art', 'English', 'Science', 'Math'],
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    XLSX.writeFile(wb, 'timetable-template.xlsx');
    toast.success('Template downloaded!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        throw new Error('File is empty or invalid');
      }

      // Parse header row
      const headers = jsonData[0] as string[];
      const timeSlotCol = 0;
      const startTimeCol = 1;
      const durationCol = 2;
      const dayColumns = headers.slice(3);

      // Parse time slots and cells
      const rows: TimeSlot[] = [];
      const cells: Record<string, TimetableCell> = {};
      const columns = dayColumns.filter(d => d && d.trim());

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        const label = row[timeSlotCol]?.toString() || `Period ${i}`;
        const startTime = row[startTimeCol]?.toString() || '09:00';
        const duration = parseInt(row[durationCol]?.toString() || '60');

        const timeSlot: TimeSlot = {
          id: Date.now().toString() + i,
          label,
          startTime,
          duration,
        };
        rows.push(timeSlot);

        // Parse cells for this row
        for (let colIndex = 0; colIndex < columns.length; colIndex++) {
          const cellValue = row[3 + colIndex];
          if (cellValue && cellValue.toString().trim()) {
            const cellKey = `${i - 1}-${colIndex}`;
            cells[cellKey] = {
              rowIndex: i - 1,
              colIndex,
              fields: [cellValue.toString().trim()],
            };
          }
        }
      }

      const newTimetable: Timetable = {
        id: Date.now().toString(),
        name: file.name.replace('.xlsx', '').replace('.xls', ''),
        favorite: false,
        type: 'weekly',
        mode: 'rigid',
        rows,
        columns,
        fieldsPerCell: 1,
        cells,
        colorKey: {},
        createdAt: new Date().toISOString(),
      };

      onCreate(newTimetable);
      toast.success('Timetable imported successfully!');
      onClose();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import timetable. Please check the file format.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Timetable from Excel</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted p-4 rounded-md space-y-2 text-sm">
            <h4 className="font-semibold">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Download the template below to see the required format</li>
              <li>Fill in your timetable data in the Excel file</li>
              <li>Columns: Time Slot, Start Time (HH:MM), Duration (minutes), then day names</li>
              <li>Each row represents a time period in your schedule</li>
              <li>Upload your completed file using the button below</li>
            </ol>
          </div>

          <Button onClick={generateTemplate} variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>

          <div className="border-t pt-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {importing ? 'Importing...' : 'Upload Excel File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
