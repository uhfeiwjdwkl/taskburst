import { cn } from '@/lib/utils';
import { PROGRESS_GRID_ICONS } from '@/types/settings';
import { useEffect, useRef } from 'react';

interface IconGridProps {
  value: string;
  onChange: (icon: string) => void;
  color?: string;
  className?: string;
}

// Convert hex to CSS filter to colorize SVGs
function hexToFilter(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'none';
  
  // Calculate approximate filter to match the color
  const { r, g, b } = rgb;
  const hue = getHue(rgb);
  const saturation = getSaturation(rgb);
  const lightness = getLightness(rgb);
  
  // Create filter that approximates the color
  return `brightness(0) saturate(100%) invert(${lightness}%) sepia(100%) saturate(${Math.round(saturation * 10)}%) hue-rotate(${Math.round(hue)}deg) brightness(${0.5 + lightness / 200}%)`;
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
  
  if (max !== min) {
    const d = max - min;
    if (max === r) h = 60 * ((g - b) / d);
    else if (max === g) h = 60 * (2 + (b - r) / d);
    else h = 60 * (4 + (r - g) / d);
  }
  
  if (h < 0) h += 360;
  return h;
}

function getSaturation(rgb: { r: number; g: number; b: number }): number {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  
  if (max === min) return 0;
  const d = max - min;
  return l > 0.5 ? d / (2 - max - min) : d / (max + min);
}

function getLightness(rgb: { r: number; g: number; b: number }): number {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  return ((Math.max(r, g, b) + Math.min(r, g, b)) / 2) * 100;
}

export const IconGrid = ({ value, onChange, color = '#8b5cf6', className }: IconGridProps) => {
  return (
    <div className={cn("grid grid-cols-8 gap-1.5 max-h-48 overflow-y-auto p-1", className)}>
      {PROGRESS_GRID_ICONS.map((icon) => (
        <button
          key={icon}
          onClick={() => onChange(icon)}
          className={cn(
            "w-8 h-8 rounded-md border-2 transition-all hover:scale-110 flex items-center justify-center p-1 bg-card",
            value === icon ? 'border-foreground ring-2 ring-ring/50' : 'border-border hover:bg-muted/50'
          )}
          title={icon}
        >
          <img 
            src={`/icons/${encodeURIComponent(icon)}.svg`}
            alt={icon}
            className="w-5 h-5"
            style={{ filter: hexToFilter(color) }}
          />
        </button>
      ))}
    </div>
  );
};
