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
    const bgColor = filled ? (subtaskColor || color) : 'transparent';
    const borderColor = subtaskColor || color;
    const textColor = filled ? '#fff' : (subtaskColor || color);
    
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
  const bgColor = filled ? color : 'hsl(var(--secondary))';
  const textColor = filled ? '#fff' : color;

  return (
    <button
      onClick={onClick}
      style={{ 
        width: size, 
        height: size,
        backgroundColor: bgColor,
      }}
      className={cn(
        'rounded-sm transition-all flex items-center justify-center border border-border hover:scale-110',
        className
      )}
    >
      {children && (
        <span style={{ color: textColor }} className={cn(textSizeClasses[textSize], 'font-medium')}>
          {children}
        </span>
      )}
    </button>
  );
};

// Alias for simpler usage
export const ProgressGridBox = ProgressGridIcon;

export default ProgressGridIcon;
