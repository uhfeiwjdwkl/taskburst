import { cn } from '@/lib/utils';
import { PROGRESS_GRID_ICONS } from '@/types/settings';

interface IconGridProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
  className?: string;
}

export const IconGrid = ({ value, onChange, color = '#6366f1', className }: IconGridProps) => {
  return (
    <div className={cn("grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto p-1", className)}>
      {PROGRESS_GRID_ICONS.map((icon) => (
        <button
          key={icon}
          onClick={() => onChange(icon)}
          className={cn(
            "w-8 h-8 rounded-md border-2 transition-all hover:scale-110 flex items-center justify-center p-1",
            value === icon ? 'border-foreground ring-2 ring-primary/50 bg-muted' : 'border-transparent hover:bg-muted/50'
          )}
          title={icon}
        >
          <img 
            src={`/icons/${encodeURIComponent(icon)}.svg`}
            alt={icon}
            className="w-5 h-5"
            style={{ filter: `drop-shadow(0 0 0 ${color})` }}
          />
        </button>
      ))}
    </div>
  );
};
