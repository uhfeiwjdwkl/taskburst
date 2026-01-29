import { ProgressGridShape } from '@/types/settings';
import { cn } from '@/lib/utils';

interface ProgressGridShapeProps {
  shape: ProgressGridShape;
  filled: boolean;
  color?: string;
  size?: number;
  className?: string;
  children?: React.ReactNode;
  textSize?: 'xs' | 'sm' | 'md';
}

export const ProgressGridShapeComponent = ({
  shape,
  filled,
  color = '#6366f1',
  size = 28,
  className,
  children,
  textSize = 'xs',
}: ProgressGridShapeProps) => {
  const textSizeClasses = {
    xs: 'text-[8px]',
    sm: 'text-[10px]',
    md: 'text-xs',
  };

  const baseStyle = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const filledColor = filled ? color : undefined;
  const bgColor = filled ? color : 'hsl(var(--secondary))';
  const textColor = filled ? '#fff' : (color || 'inherit');

  // SVG-based shapes for complex icons
  const renderShape = () => {
    switch (shape) {
      case 'circle':
        return (
          <div
            style={{ ...baseStyle, backgroundColor: bgColor, borderRadius: '50%' }}
            className={cn('border border-border transition-all', className)}
          >
            <span style={{ color: textColor }} className={textSizeClasses[textSize]}>{children}</span>
          </div>
        );
      
      case 'rounded-square':
        return (
          <div
            style={{ ...baseStyle, backgroundColor: bgColor, borderRadius: '4px' }}
            className={cn('border border-border transition-all', className)}
          >
            <span style={{ color: textColor }} className={textSizeClasses[textSize]}>{children}</span>
          </div>
        );

      case 'hexagon':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size}>
              <polygon
                points="12,2 22,8 22,16 12,22 2,16 2,8"
                fill={bgColor}
                stroke="currentColor"
                strokeWidth="0.5"
                className="stroke-border"
              />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      case 'star':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size}>
              <polygon
                points="12,2 15,9 22,9 17,14 19,22 12,17 5,22 7,14 2,9 9,9"
                fill={bgColor}
                stroke="currentColor"
                strokeWidth="0.5"
                className="stroke-border"
              />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      case 'triangle':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size}>
              <polygon
                points="12,3 22,21 2,21"
                fill={bgColor}
                stroke="currentColor"
                strokeWidth="0.5"
                className="stroke-border"
              />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center pt-1', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      case 'rhombus':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size}>
              <polygon
                points="12,2 22,12 12,22 2,12"
                fill={bgColor}
                stroke="currentColor"
                strokeWidth="0.5"
                className="stroke-border"
                rx="2"
              />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      case 'apple':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size} fill={bgColor}>
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.52-3.23 0-1.44.63-2.2.47-3.08-.4-5.01-5.12-4.27-12.85 1.27-13.2 1.29.07 2.19.71 2.93.71.74 0 1.89-.71 3.18-.6 1.36.08 2.38.55 3.04 1.4-2.5 1.5-2.09 4.8.52 5.86-.52 1.38-1.19 2.72-2.01 4.09" className="stroke-border" strokeWidth="0.3" />
              <path d="M12 3.5c.58-2.07 2.31-3.62 4-3.5.25 2.14-1.95 4.16-4 3.5z" />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      case 'fire':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size} fill={bgColor}>
              <path d="M12 23c-4.42 0-8-3.58-8-8 0-2.76 1.64-5.14 4-6.39-.08.39-.12.79-.12 1.19 0 2.21 1.79 4 4 4 1.1 0 2.1-.45 2.83-1.17l.17-.17c.73-.73 1.17-1.73 1.17-2.83 0-1.1-.45-2.1-1.17-2.83L12 4c4.42 0 8 3.58 8 8s-3.58 11-8 11z" className="stroke-border" strokeWidth="0.3" />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      case 'leaf':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size} fill={bgColor}>
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" className="stroke-border" strokeWidth="0.3" />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      case 'sun':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size} fill={bgColor}>
              <circle cx="12" cy="12" r="5" className="stroke-border" strokeWidth="0.3" />
              <line x1="12" y1="1" x2="12" y2="3" stroke={bgColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="12" y1="21" x2="12" y2="23" stroke={bgColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke={bgColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke={bgColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="1" y1="12" x2="3" y2="12" stroke={bgColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="21" y1="12" x2="23" y2="12" stroke={bgColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke={bgColor} strokeWidth="2" strokeLinecap="round" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke={bgColor} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      case 'moon':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size} fill={bgColor}>
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" className="stroke-border" strokeWidth="0.3" />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      case 'trophy':
        return (
          <div style={baseStyle} className={cn('relative', className)}>
            <svg viewBox="0 0 24 24" width={size} height={size} fill={bgColor}>
              <path d="M8 21h8m-4-4v4m-6-8c-1.5 0-3-1-3-3V4h4m14 6c0 2-1.5 3-3 3m3-9h-4M5 4h14v6c0 3.31-2.69 6-6 6h-2c-3.31 0-6-2.69-6-6V4z" fill="none" stroke={bgColor} strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span 
              style={{ color: textColor }} 
              className={cn('absolute inset-0 flex items-center justify-center', textSizeClasses[textSize])}
            >
              {children}
            </span>
          </div>
        );

      // Fallback to rounded square for unimplemented shapes
      default:
        return (
          <div
            style={{ ...baseStyle, backgroundColor: bgColor, borderRadius: '4px' }}
            className={cn('border border-border transition-all', className)}
          >
            <span style={{ color: textColor }} className={textSizeClasses[textSize]}>{children}</span>
          </div>
        );
    }
  };

  return renderShape();
};

export default ProgressGridShapeComponent;
