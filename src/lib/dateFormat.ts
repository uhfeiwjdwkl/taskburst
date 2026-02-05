// Utility functions for date formatting

import { AppSettings, DEFAULT_SETTINGS } from '@/types/settings';

// Get settings from localStorage
function getSettings(): AppSettings {
  const saved = localStorage.getItem('appSettings');
  if (saved) {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  }
  return DEFAULT_SETTINGS;
}

export const formatDateToDDMMYYYY = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  const settings = getSettings();
  
  switch (settings.dateFormat) {
    case 'MM-DD-YYYY':
      return `${month}-${day}-${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD-MM-YYYY':
    default:
      return `${day}-${month}-${year}`;
  }
};

export const formatDateTimeToDDMMYYYY = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};

export const convertDDMMYYYYToISO = (ddmmyyyy: string): string => {
  if (!ddmmyyyy) return '';
  
  const parts = ddmmyyyy.split('-');
  if (parts.length !== 3) return '';
  
  const [day, month, year] = parts;
  return `${year}-${month}-${day}`;
};

export const formatDateTimeLocalInput = (dateString: string | undefined): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const formatTimeTo12Hour = (time: string): string => {
  if (!time) return '';
  
  const settings = getSettings();
  return formatTimeWithSettings(time, settings.timeFormat);
};

// Format time with specific settings
export const formatTimeWithSettings = (time: string, format: '12h' | '24h'): string => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':').map(Number);
  
  if (format === '24h') {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};

// Format a Date object's time according to settings
export const formatDateTime = (date: Date): string => {
  const settings = getSettings();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  if (settings.timeFormat === '24h') {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
};
