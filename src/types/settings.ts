export interface PageConfig {
  id: string;
  name: string;
  icon: string;
  path: string;
  visible: boolean;
  order: number;
}

export const DEFAULT_PAGES: PageConfig[] = [
  { id: 'home', name: 'Home', icon: 'Home', path: '/', visible: true, order: 0 },
  { id: 'categories', name: 'Categories', icon: 'FolderOpen', path: '/categories', visible: true, order: 1 },
  { id: 'lists', name: 'Lists', icon: 'List', path: '/lists', visible: true, order: 2 },
  { id: 'projects', name: 'Projects', icon: 'Briefcase', path: '/projects', visible: true, order: 3 },
  { id: 'calendar', name: 'Calendar', icon: 'Calendar', path: '/calendar', visible: true, order: 4 },
  { id: 'timetable', name: 'Timetable', icon: 'Table', path: '/timetable', visible: true, order: 5 },
  { id: 'results', name: 'Results', icon: 'Award', path: '/results', visible: true, order: 6 },
  { id: 'history', name: 'History', icon: 'HistoryIcon', path: '/history', visible: true, order: 7 },
  { id: 'archive', name: 'Archive', icon: 'Archive', path: '/archive', visible: true, order: 8 },
  { id: 'recently-deleted', name: 'Recently Deleted', icon: 'Clock', path: '/recently-deleted', visible: true, order: 9 },
];

// Progress grid shape options
export type ProgressGridShape = 
  | 'rounded-square' 
  | 'circle' 
  | 'apple' 
  | 'rounded-checkbox' 
  | 'lightning' 
  | 'calendar' 
  | 'rhombus' 
  | 'fire' 
  | 'hexagon' 
  | 'leaf' 
  | 'sun' 
  | 'moon' 
  | 'sprout' 
  | 'star' 
  | 'triangle' 
  | 'trophy' 
  | 'tree' 
  | 'pi' 
  | 'notebook' 
  | 'paper-pen' 
  | 'laptop' 
  | 'double-arrow' 
  | 'book' 
  | 'soccer';

export const PROGRESS_GRID_SHAPES: { value: ProgressGridShape; label: string }[] = [
  { value: 'rounded-square', label: 'Rounded Square' },
  { value: 'circle', label: 'Circle' },
  { value: 'apple', label: 'Apple' },
  { value: 'rounded-checkbox', label: 'Rounded Checkbox' },
  { value: 'lightning', label: 'Lightning Bolt' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'rhombus', label: 'Rhombus' },
  { value: 'fire', label: 'Fire' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'sun', label: 'Sun' },
  { value: 'moon', label: 'Moon' },
  { value: 'sprout', label: 'Sprout' },
  { value: 'star', label: '5-Point Star' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'trophy', label: 'Trophy' },
  { value: 'tree', label: 'Tree' },
  { value: 'pi', label: 'Pi Symbol' },
  { value: 'notebook', label: 'Notebook' },
  { value: 'paper-pen', label: 'Paper & Pen' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'double-arrow', label: 'Double Arrow Circle' },
  { value: 'book', label: 'Book' },
  { value: 'soccer', label: 'Soccer Ball' },
];

// Color palettes
export type ColorPalette = 'default' | 'ocean' | 'forest' | 'sunset' | 'lavender' | 'monochrome' | 'candy' | 'earth';

export const COLOR_PALETTES: { value: ColorPalette; label: string; colors: string[] }[] = [
  { value: 'default', label: 'Default', colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'] },
  { value: 'ocean', label: 'Ocean', colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#3b82f6', '#6366f1'] },
  { value: 'forest', label: 'Forest', colors: ['#22c55e', '#16a34a', '#15803d', '#84cc16', '#a3e635'] },
  { value: 'sunset', label: 'Sunset', colors: ['#f97316', '#fb923c', '#fbbf24', '#ef4444', '#f43f5e'] },
  { value: 'lavender', label: 'Lavender', colors: ['#a855f7', '#8b5cf6', '#c084fc', '#d946ef', '#e879f9'] },
  { value: 'monochrome', label: 'Monochrome', colors: ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'] },
  { value: 'candy', label: 'Candy', colors: ['#ec4899', '#f472b6', '#fb7185', '#14b8a6', '#06b6d4'] },
  { value: 'earth', label: 'Earth', colors: ['#78350f', '#92400e', '#b45309', '#d97706', '#a16207'] },
];

// Subtask shape for progress boxes
export type SubtaskBoxShape = 'circle' | 'rounded-square';

export interface AppSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakInterval: number; // every N breaks
  dateFormat: 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'YYYY-MM-DD';
  brightness: number; // 50-150, 100 is normal
  pages: PageConfig[];
  pinProtection: boolean;
  pin?: string;
  useDropdownNav: boolean; // Force dropdown navigation instead of rows
  
  // New settings
  timezone: string; // e.g., 'UTC', 'America/New_York'
  colorPalette: ColorPalette;
  
  // Progress grid settings
  progressGridShape: ProgressGridShape;
  progressGridColor: string; // Color from timetable/palette
  allowPerTaskProgressSettings: boolean; // Toggle to allow per-task shape/color
  
  // Subtask progress box settings
  subtaskBoxShape: SubtaskBoxShape;
  subtaskBoxTextSize: 'xs' | 'sm' | 'md'; // Text size within subtask boxes
}

export const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  soundEnabled: true,
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dateFormat: 'DD-MM-YYYY',
  brightness: 100,
  pages: DEFAULT_PAGES,
  pinProtection: false,
  pin: undefined,
  useDropdownNav: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  colorPalette: 'default',
  progressGridShape: 'rounded-square',
  progressGridColor: '#6366f1',
  allowPerTaskProgressSettings: false,
  subtaskBoxShape: 'circle',
  subtaskBoxTextSize: 'xs',
};
