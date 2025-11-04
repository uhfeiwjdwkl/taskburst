import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Label } from '@/components/ui/label';

interface BreakDurationMenuProps {
  onSelectDuration: (minutes: number) => void;
}

export const BreakDurationMenu = ({ onSelectDuration }: BreakDurationMenuProps) => {
  const [customValue, setCustomValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const presetDurations = [
    { label: 'Short Break (5 min)', value: 5 },
    { label: 'Medium Break (15 min)', value: 15 },
    { label: 'Long Break (20 min)', value: 20 },
    { label: 'Extended Break (30 min)', value: 30 },
  ];

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(customValue);
    if (value > 0 && value <= 120) {
      onSelectDuration(value);
      setCustomValue('');
      setIsOpen(false);
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Change Break Duration <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[240px]">
        <DropdownMenuLabel>Select Break Duration</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {presetDurations.map((preset) => (
          <DropdownMenuItem
            key={preset.value}
            onClick={() => {
              onSelectDuration(preset.value);
              setIsOpen(false);
            }}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <div className="p-2">
          <form onSubmit={handleCustomSubmit}>
            <Label className="text-xs">Custom Duration (minutes)</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="number"
                min="1"
                max="120"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Enter minutes"
                className="h-8"
              />
              <Button type="submit" size="sm" className="h-8">
                Set
              </Button>
            </div>
          </form>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};