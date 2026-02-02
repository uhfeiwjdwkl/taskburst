type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const cleaned = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return { r, g, b };
};

// Returns Tailwind/shadcn-style HSL parts: "250 70% 60%"
export const hexToHslParts = (hex: string): string | null => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;

  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  const hh = Math.round(h);
  const ss = Math.round(clamp01(s) * 100);
  const ll = Math.round(clamp01(l) * 100);
  return `${hh} ${ss}% ${ll}%`;
};

export const applyColorThemeToDocument = (colors: ThemeColors) => {
  const primary = hexToHslParts(colors.primary);
  const secondary = hexToHslParts(colors.secondary);
  const accent = hexToHslParts(colors.accent);
  if (!primary || !secondary || !accent) return;

  const root = document.documentElement;

  root.style.setProperty('--primary', primary);
  root.style.setProperty('--ring', primary);
  root.style.setProperty('--accent', accent);

  // Update gradients to match theme
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, hsl(${primary}), hsl(${accent}))`);
  root.style.setProperty('--shadow-glow', `0 10px 40px -10px hsl(${primary} / 0.3)`);
};

// Reset to default theme (purple)
export const resetToDefaultTheme = () => {
  const root = document.documentElement;
  
  root.style.removeProperty('--primary');
  root.style.removeProperty('--ring');
  root.style.removeProperty('--accent');
  root.style.removeProperty('--gradient-primary');
  root.style.removeProperty('--shadow-glow');
};
