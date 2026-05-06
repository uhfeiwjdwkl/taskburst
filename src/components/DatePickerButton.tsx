import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerButtonProps {
  /** ISO date string "YYYY-MM-DD" or datetime-local "YYYY-MM-DDTHH:mm" */
  value: string;
  onChange: (value: string) => void;
  /** Preserve the time portion when value is datetime-local */
  withTime?: boolean;
  className?: string;
}

const parseDate = (v: string): Date | undefined => {
  if (!v) return undefined;
  const dPart = v.includes('T') ? v.split('T')[0] : v;
  const [y, m, d] = dPart.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};

export function DatePickerButton({ value, onChange, withTime, className }: DatePickerButtonProps) {
  const date = parseDate(value);
  const handleSelect = (d?: Date) => {
    if (!d) return;
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (withTime) {
      const timePart = value.includes('T') ? value.split('T')[1] : '09:00';
      onChange(`${iso}T${timePart}`);
    } else {
      onChange(iso);
    }
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={cn('flex-shrink-0', className)}
          aria-label="Pick a date"
        >
          <CalendarIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className={cn('p-3 pointer-events-auto')}
        />
      </PopoverContent>
    </Popover>
  );
}