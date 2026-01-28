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
};