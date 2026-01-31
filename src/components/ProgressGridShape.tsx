import { cn } from '@/lib/utils';

interface ProgressGridIconProps {
  icon?: string;
  filled: boolean;
  color?: string;
  size?: number;
  className?: string;
  children?: React.ReactNode;
  textSize?: 'xxs' | 'xs' | 'sm' | 'md';
  isSubtask?: boolean;
  subtaskColor?: string;
  onClick?: () => void;
}

export const ProgressGridIcon = ({
  icon = 'square',
  filled,
  color = '#6366f1',
  size = 28,
  className,
  children,
  textSize = 'xs',
  isSubtask = false,
  subtaskColor,
  onClick,
}: ProgressGridIconProps) => {
  const textSizeClasses = {
    xxs: 'text-[6px]',
    xs: 'text-[8px]',
    sm: 'text-[10px]',
    md: 'text-xs',
  };

  // For subtasks - stretched rounded rectangle
  if (isSubtask) {
    // Incomplete subtask boxes use their own color (outline + text).
    // Completed subtask boxes use the global completed color (settings.progressGridColor).
    const borderColor = subtaskColor || color;
    const bgColor = filled ? color : 'transparent';
    const textColor = filled ? '#fff' : borderColor;
    
    return (
      <button
        onClick={onClick}
        style={{ 
          minWidth: size,
          height: size,
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 2,
        }}
        className={cn(
          'rounded-md transition-all flex items-center justify-center px-1.5 hover:scale-105',
          className
        )}
      >
        <span style={{ color: textColor }} className={cn(textSizeClasses[textSize], 'font-medium whitespace-nowrap')}>
          {children}
        </span>
      </button>
    );
  }

  // Regular progress box
  const imgSrc = `/icons/${encodeURIComponent(icon)}.svg`;

  return (
    <button
      onClick={onClick}
      style={{ width: size, height: size, backgroundColor: filled ? color : undefined, borderColor: color }}
      className={cn(
        'rounded-md transition-all flex items-center justify-center border bg-card hover:scale-110',
        className
      )}
    >
      {children ? (
        <span style={{ color: filled ? '#fff' : color }} className={cn(textSizeClasses[textSize], 'font-medium')}>
          {children}
        </span>
      ) : (
        <img
          src={imgSrc}
          alt=""
          aria-hidden="true"
          className="h-[70%] w-[70%] select-none pointer-events-none"
          style={{
            filter: filled ? 'brightness(0) invert(1)' : undefined,
          }}
        />
      )}
    </button>
  );
};

// Alias for simpler usage
export const ProgressGridBox = ProgressGridIcon;

export default ProgressGridIcon;
