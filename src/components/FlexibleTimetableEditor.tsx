import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Timetable } from '@/types/timetable';

interface FlexibleTimetableEditorProps {
  timetable: Timetable;
  onUpdate: (updates: Partial<Timetable>) => void;
}

const INTERVAL_PRESETS = [
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '20', label: '20 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '45', label: '45 minutes' },
  { value: '60', label: '1 hour' },
  { value: '90', label: '1.5 hours' },
  { value: '120', label: '2 hours' },
  { value: 'custom', label: 'Custom...' },
];

export function FlexibleTimetableEditor({ timetable, onUpdate }: FlexibleTimetableEditorProps) {
  const currentInterval = timetable.flexInterval || 60;
  const isCustomInterval = !INTERVAL_PRESETS.some(p => p.value === currentInterval.toString() && p.value !== 'custom');

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">Flexible Timetable Settings</h3>
      <p className="text-sm text-muted-foreground">
        Configure the time range and interval display. Events are not restricted to intervals and can span any time.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Start Time</Label>
          <Input
            type="time"
            value={timetable.flexStartTime || '06:00'}
            onChange={(e) => onUpdate({ flexStartTime: e.target.value })}
            className="mt-1"
          />
        </div>
        <div>
          <Label>End Time</Label>
          <Input
            type="time"
            value={timetable.flexEndTime || '22:00'}
            onChange={(e) => onUpdate({ flexEndTime: e.target.value })}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label>Time Interval Markers</Label>
        <Select 
          value={isCustomInterval ? 'custom' : currentInterval.toString()}
          onValueChange={(v) => {
            if (v !== 'custom') {
              onUpdate({ flexInterval: parseInt(v) });
            }
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {INTERVAL_PRESETS.map(preset => (
              <SelectItem key={preset.value} value={preset.value}>
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {isCustomInterval && (
          <div className="mt-2">
            <Label className="text-xs text-muted-foreground">Custom interval (minutes)</Label>
            <Input
              type="number"
              min="5"
              max="240"
              step="5"
              value={currentInterval}
              onChange={(e) => onUpdate({ flexInterval: parseInt(e.target.value) || 60 })}
              className="mt-1"
            />
          </div>
        )}
      </div>

      <div>
        <Label>Time Format</Label>
        <Select 
          value={timetable.flexTimeFormat || '12h'}
          onValueChange={(v) => onUpdate({ flexTimeFormat: v as '12h' | '24h' })}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
            <SelectItem value="24h">24-hour</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
