export interface AppSettings {
  darkMode: boolean;
  soundEnabled: boolean;
  focusDuration: number; // minutes
  breakDuration: number; // minutes
  longBreakDuration: number; // minutes
  longBreakInterval: number; // every N breaks
  dateFormat: 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'YYYY-MM-DD';
}

export const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  soundEnabled: true,
  focusDuration: 25,
  breakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  dateFormat: 'DD-MM-YYYY',
};
