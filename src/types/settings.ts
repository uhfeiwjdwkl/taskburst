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

// Available icons for progress grid shapes - from public/icons folder
export const PROGRESS_GRID_ICONS = [
  'apple',
  'badge check',
  'badge',
  'book',
  'calendar check',
  'circle check',
  'circle play',
  'circle',
  'clock',
  'cog',
  'crown',
  'diamond',
  'fire',
  'hexagon',
  'laptop',
  'leaf',
  'lightning bolt',
  'meteor',
  'moon',
  'music',
  'notebook',
  'page',
  'palette',
  'pencil',
  'person',
  'pi',
  'seedling',
  'smile',
  'soccer ball',
  'square',
  'star',
  'stopwatch',
  'target arrow',
  'tennis ball',
  'text',
  'tree',
  'triangle',
  'trophy',
  'arrows circle',
];

// Preset colors for progress grid and other color pickers
export const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
  '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#94a3b8'
];

// Site-wide color themes
export interface ColorTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
}

export const COLOR_THEMES = [
  { 
    id: 'default', 
    name: 'Purple (Default)', 
    colors: { primary: '#8b5cf6', secondary: '#a855f7', accent: '#6366f1' }
  },
  { 
    id: 'indigo', 
    name: 'Indigo', 
    colors: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#10b981' }
  },
  { 
    id: 'ocean', 
    name: 'Ocean', 
    colors: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#14b8a6' }
  },
  { 
    id: 'forest', 
    name: 'Forest', 
    colors: { primary: '#22c55e', secondary: '#16a34a', accent: '#84cc16' }
  },
  { 
    id: 'sunset', 
    name: 'Sunset', 
    colors: { primary: '#f97316', secondary: '#fb923c', accent: '#ef4444' }
  },
  { 
    id: 'lavender', 
    name: 'Lavender', 
    colors: { primary: '#a855f7', secondary: '#8b5cf6', accent: '#d946ef' }
  },
  { 
    id: 'rose', 
    name: 'Rose', 
    colors: { primary: '#ec4899', secondary: '#f472b6', accent: '#fb7185' }
  },
  { 
    id: 'amber', 
    name: 'Amber', 
    colors: { primary: '#f59e0b', secondary: '#fbbf24', accent: '#d97706' }
  },
  { 
    id: 'slate', 
    name: 'Slate', 
    colors: { primary: '#64748b', secondary: '#94a3b8', accent: '#475569' }
  },
];

// Timezone presets with all major zones
export const TIMEZONE_PRESETS = [
  { value: 'UTC', label: 'UTC+0 (UTC)', offset: 0 },
  { value: 'Etc/GMT+12', label: 'UTC-12', offset: -12 },
  { value: 'Etc/GMT+11', label: 'UTC-11', offset: -11 },
  { value: 'Etc/GMT+10', label: 'UTC-10 (Hawaii)', offset: -10 },
  { value: 'Etc/GMT+9', label: 'UTC-9 (Alaska)', offset: -9 },
  { value: 'America/Los_Angeles', label: 'UTC-8 (Pacific)', offset: -8 },
  { value: 'America/Denver', label: 'UTC-7 (Mountain)', offset: -7 },
  { value: 'America/Chicago', label: 'UTC-6 (Central)', offset: -6 },
  { value: 'America/New_York', label: 'UTC-5 (Eastern)', offset: -5 },
  { value: 'America/Caracas', label: 'UTC-4 (Atlantic)', offset: -4 },
  { value: 'America/St_Johns', label: 'UTC-3:30 (Newfoundland)', offset: -3.5 },
  { value: 'America/Sao_Paulo', label: 'UTC-3 (Brazil)', offset: -3 },
  { value: 'Etc/GMT+2', label: 'UTC-2', offset: -2 },
  { value: 'Etc/GMT+1', label: 'UTC-1 (Azores)', offset: -1 },
  { value: 'Europe/London', label: 'UTC+0 (London)', offset: 0 },
  { value: 'Europe/Paris', label: 'UTC+1 (Paris)', offset: 1 },
  { value: 'Europe/Berlin', label: 'UTC+1 (Berlin)', offset: 1 },
  { value: 'Africa/Cairo', label: 'UTC+2 (Cairo)', offset: 2 },
  { value: 'Europe/Moscow', label: 'UTC+3 (Moscow)', offset: 3 },
  { value: 'Asia/Tehran', label: 'UTC+3:30 (Iran)', offset: 3.5 },
  { value: 'Asia/Dubai', label: 'UTC+4 (Dubai)', offset: 4 },
  { value: 'Asia/Kabul', label: 'UTC+4:30 (Afghanistan)', offset: 4.5 },
  { value: 'Asia/Karachi', label: 'UTC+5 (Pakistan)', offset: 5 },
  { value: 'Asia/Kolkata', label: 'UTC+5:30 (India)', offset: 5.5 },
  { value: 'Asia/Kathmandu', label: 'UTC+5:45 (Nepal)', offset: 5.75 },
  { value: 'Asia/Dhaka', label: 'UTC+6 (Bangladesh)', offset: 6 },
  { value: 'Asia/Yangon', label: 'UTC+6:30 (Myanmar)', offset: 6.5 },
  { value: 'Asia/Bangkok', label: 'UTC+7 (Bangkok)', offset: 7 },
  { value: 'Asia/Singapore', label: 'UTC+8 (Singapore)', offset: 8 },
  { value: 'Asia/Shanghai', label: 'UTC+8 (China)', offset: 8 },
  { value: 'Australia/Darwin', label: 'UTC+9:30 (Australia NT)', offset: 9.5 },
  { value: 'Asia/Tokyo', label: 'UTC+9 (Tokyo)', offset: 9 },
  { value: 'Australia/Adelaide', label: 'UTC+9:30/10:30 (Australia SA)', offset: 9.5 },
  { value: 'Australia/Sydney', label: 'UTC+10/11 (Sydney)', offset: 10 },
  { value: 'Pacific/Noumea', label: 'UTC+11', offset: 11 },
  { value: 'Pacific/Auckland', label: 'UTC+12 (New Zealand)', offset: 12 },
  { value: 'Pacific/Tongatapu', label: 'UTC+13 (Tonga)', offset: 13 },
  { value: 'Pacific/Kiritimati', label: 'UTC+14 (Kiritimati)', offset: 14 },
  { value: 'custom', label: 'Custom UTC Offset...', offset: 0 },
];

// Date format options
export type DateFormat = 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';

// Time format options
export type TimeFormat = '12h' | '24h';

// Subtask text sizes
export type SubtaskTextSize = 'xxs' | 'xs' | 'sm' | 'md';

export const SUBTASK_TEXT_SIZES: { value: SubtaskTextSize; label: string }[] = [
  { value: 'xxs', label: 'Extra Small' },
  { value: 'xs', label: 'Small' },
  { value: 'sm', label: 'Medium' },
  { value: 'md', label: 'Large' },
];

export interface AppSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  focusDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  longBreakInterval: number;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  brightness: number;
  pages: PageConfig[];
  pinProtection: boolean;
  pinHash?: string; // bcrypt hashed PIN
  useDropdownNav: boolean;
  
  // Timezone settings
  timezone: string;
  customUtcOffset?: number;
  
  // Color theme
  colorTheme: string;
  customColors: string[];
  
  // Progress grid settings
  progressGridIcon: string;
  progressGridColor: string;
  allowPerTaskProgressSettings: boolean;
  
  // Subtask progress box settings (text size only)
  subtaskTextSize: SubtaskTextSize;
  
  // Homepage timetable display settings
  homepageTimetableMode: 'none' | 'constant' | 'scheduled';
  homepageTimetableId?: string; // For constant mode
  homepageTimetableSchedule?: { // For scheduled mode
    timetableId: string;
    dayOfWeek?: number[]; // 0-6, Sunday-Saturday
    startTime?: string; // "HH:MM" format
    endTime?: string;
  }[];

  // Auto-link subtasks to progress grid when created from bullets
  autoLinkSubtasksToGrid: boolean;

  // Timer mode: 'countdown' (subtractive/pomodoro) or 'stopwatch' (additive)
  timerMode: 'countdown' | 'stopwatch';
}

export const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  soundEnabled: true,
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dateFormat: 'DD-MM-YYYY',
  timeFormat: '12h',
  brightness: 100,
  pages: DEFAULT_PAGES,
  pinProtection: false,
  pinHash: undefined,
  useDropdownNav: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  customUtcOffset: undefined,
  colorTheme: 'default',
  customColors: [],
  progressGridIcon: 'square',
  progressGridColor: '#8b5cf6', // Purple default
  allowPerTaskProgressSettings: false,
  subtaskTextSize: 'xs',
  homepageTimetableMode: 'none',
  homepageTimetableId: undefined,
  homepageTimetableSchedule: undefined,
  autoLinkSubtasksToGrid: false,
  timerMode: 'countdown',
};

// Legacy color palettes for backwards compatibility
export const COLOR_PALETTES = [
  { value: 'default', label: 'Default', colors: ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'] },
  { value: 'ocean', label: 'Ocean', colors: ['#0ea5e9', '#06b6d4', '#14b8a6', '#3b82f6', '#6366f1'] },
  { value: 'forest', label: 'Forest', colors: ['#22c55e', '#16a34a', '#15803d', '#84cc16', '#a3e635'] },
  { value: 'sunset', label: 'Sunset', colors: ['#f97316', '#fb923c', '#fbbf24', '#ef4444', '#f43f5e'] },
  { value: 'lavender', label: 'Lavender', colors: ['#a855f7', '#8b5cf6', '#c084fc', '#d946ef', '#e879f9'] },
  { value: 'monochrome', label: 'Monochrome', colors: ['#374151', '#4b5563', '#6b7280', '#9ca3af', '#d1d5db'] },
  { value: 'candy', label: 'Candy', colors: ['#ec4899', '#f472b6', '#fb7185', '#14b8a6', '#06b6d4'] },
  { value: 'earth', label: 'Earth', colors: ['#78350f', '#92400e', '#b45309', '#d97706', '#a16207'] },
];
