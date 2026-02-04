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
  color = '#8b5cf6',
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
    // Completed: colored background with white text
    // Incomplete: white/light background with colored text/border
    const borderColor = subtaskColor || color;
    const bgColor = filled ? (subtaskColor || color) : 'white';
    const textColor = filled ? 'white' : (subtaskColor || color);
    
    return (
      <button
        onClick={onClick}
        style={{ 
          minWidth: size,
          height: size,
          backgroundColor: bgColor,
          borderColor: borderColor,
          borderWidth: 2,
          color: textColor,
        }}
        className={cn(
          'rounded-md transition-all flex items-center justify-center px-1.5 hover:scale-105',
          className
        )}
      >
        <span className={cn(textSizeClasses[textSize], 'font-medium whitespace-nowrap')}>
          {children}
        </span>
      </button>
    );
  }

  // Regular progress box - icon only, no nested boxes
  const imgSrc = `/icons/${encodeURIComponent(icon)}.svg`;
  
  // Empty boxes are white, filled boxes show the color
  const bgColor = filled ? color : 'white';
  const borderColor = filled ? color : '#e2e8f0'; // Light gray border for empty

  return (
    <button
      onClick={onClick}
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: bgColor,
        borderColor: borderColor,
      }}
      className={cn(
        'rounded-md transition-all flex items-center justify-center border-2 hover:scale-110',
        className
      )}
    >
      <img
        src={imgSrc}
        alt=""
        aria-hidden="true"
        className="h-[65%] w-[65%] select-none pointer-events-none"
        style={{
          // When filled, icon is white; when empty, icon takes the color
          filter: filled 
            ? 'brightness(0) invert(1)' 
            : `brightness(0) saturate(100%)`,
          // Apply color to empty icons via CSS filter
          ...(filled ? {} : { filter: undefined }),
        }}
        onLoad={(e) => {
          // Dynamically color the SVG based on state
          const img = e.target as HTMLImageElement;
          if (filled) {
            img.style.filter = 'brightness(0) invert(1)';
          } else {
            // Apply color filter for empty state
            img.style.filter = getColorFilter(color);
          }
        }}
      />
    </button>
  );
};

// Convert hex color to CSS filter for SVG coloring
function getColorFilter(hex: string): string {
  // Simple approach: use drop-shadow trick or just apply the color via filter
  // For simplicity, we'll use a direct approach
  const rgb = hexToRgb(hex);
  if (!rgb) return 'none';
  
  // Calculate filter values to approximate the color
  // This is a simplified version - full conversion is complex
  return `brightness(0) saturate(100%) invert(${rgb.r / 255 * 50}%) sepia(100%) saturate(500%) hue-rotate(${getHue(rgb)}deg)`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getHue(rgb: { r: number; g: number; b: number }): number {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  
  if (max === min) {
    h = 0;
  } else if (max === r) {
    h = 60 * ((g - b) / (max - min));
  } else if (max === g) {
    h = 60 * (2 + (b - r) / (max - min));
  } else {
    h = 60 * (4 + (r - g) / (max - min));
  }
  
  if (h < 0) h += 360;
  return h;
}

// Alias for simpler usage
export const ProgressGridBox = ProgressGridIcon;

export default ProgressGridIcon;
