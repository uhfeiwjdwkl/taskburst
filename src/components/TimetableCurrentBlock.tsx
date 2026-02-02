import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Timetable } from "@/types/timetable";
import { AppSettings, DEFAULT_SETTINGS } from "@/types/settings";

export function TimetableCurrentBlock() {
  const [currentBlock, setCurrentBlock] = useState<string | null>(null);
  const [nextBlock, setNextBlock] = useState<string | null>(null);
  const [blockName, setBlockName] = useState<string | null>(null);

  useEffect(() => {
    const updateCurrentBlock = () => {
      const saved = localStorage.getItem('timetables');
      if (!saved) {
        setCurrentBlock(null);
        setNextBlock(null);
        return;
      }

      const timetables = JSON.parse(saved) as Timetable[];
      
      // Get settings to check for specific timetable selection
      const settingsSaved = localStorage.getItem('appSettings');
      const settings: AppSettings = settingsSaved 
        ? { ...DEFAULT_SETTINGS, ...JSON.parse(settingsSaved) }
        : DEFAULT_SETTINGS;

      let activeTimetables: Timetable[];
      
      if (settings.homepageTimetableMode === 'constant' && settings.homepageTimetableId) {
        // Use specific timetable
        const specific = timetables.find(t => t.id === settings.homepageTimetableId && !t.deletedAt);
        activeTimetables = specific ? [specific] : [];
      } else {
        // Use favorite timetables
        activeTimetables = timetables.filter(t => !t.deletedAt && t.favorite);
      }
      
      if (activeTimetables.length === 0) {
        setCurrentBlock(null);
        setNextBlock(null);
        return;
      }

      const now = new Date();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // Try to find current and next blocks from active timetables
      for (const timetable of activeTimetables) {
        // Find the column index for the current day
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = dayNames[currentDay];
        const colIndex = timetable.columns.indexOf(currentDayName);

        if (colIndex === -1) continue;

        // Check if we need to filter by week for fortnightly timetables
        let currentWeek: 1 | 2 = 1;
        if (timetable.type === 'fortnightly' && timetable.fortnightStartDate) {
          const startDate = new Date(timetable.fortnightStartDate);
          const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          const weeksDiff = Math.floor(daysDiff / 7);
          currentWeek = (weeksDiff % 2) === 0 ? 1 : 2;
        }

        // Find current and next blocks
        let currentFound = false;
        let nextFound = false;

        for (let i = 0; i < timetable.rows.length; i++) {
          const slot = timetable.rows[i];
          const [startHour, startMin] = slot.startTime.split(':').map(Number);
          const slotStart = startHour * 60 + startMin;
          const slotEnd = slotStart + slot.duration;

          const cellKey = `${i}-${colIndex}`;
          const cell = timetable.cells[cellKey];

          // Skip if cell is for a different week in fortnightly timetable
          if (timetable.type === 'fortnightly' && cell?.week && cell.week !== currentWeek) {
            continue;
          }

          // Check if this is the current block
          if (currentTime >= slotStart && currentTime < slotEnd) {
            if (cell && cell.fields && cell.fields.length > 0) {
              const blockText = cell.fields.filter(f => f.trim()).join(' - ');
              setCurrentBlock(blockText || 'Free Period');
              // Include slot label if set
              if (slot.label) setBlockName(slot.label);
              else setBlockName(null);
              currentFound = true;
            } else {
              setCurrentBlock('Free Period');
              if (slot.label) setBlockName(slot.label);
              else setBlockName(null);
              currentFound = true;
            }
          }

          // Check if this is the next block
          if (currentFound && !nextFound && currentTime < slotStart) {
            if (cell && cell.fields && cell.fields.length > 0) {
              const blockText = cell.fields.filter(f => f.trim()).join(' - ');
              setNextBlock(blockText || 'Free Period');
              nextFound = true;
            } else {
              setNextBlock('Free Period');
              nextFound = true;
            }
            break;
          }
        }

        if (currentFound) break;
      }

      if (!currentBlock && !nextBlock) {
        setCurrentBlock(null);
        setNextBlock(null);
      }
    };

    updateCurrentBlock();
    const interval = setInterval(updateCurrentBlock, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!currentBlock && !nextBlock) {
    return null;
  }

  return (
    <Card className="p-4 mb-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-primary" />
        <div className="flex-1">
          {currentBlock && (
            <div className="mb-1">
              <span className="text-sm font-medium text-muted-foreground">
                {blockName ? `${blockName}: ` : 'Current: '}
              </span>
              <span className="font-semibold">{currentBlock}</span>
            </div>
          )}
          {nextBlock && (
            <div>
              <span className="text-sm font-medium text-muted-foreground">Next: </span>
              <span className="font-semibold">{nextBlock}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
