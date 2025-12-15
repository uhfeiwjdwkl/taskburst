export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string (start date)
  endDate?: string; // ISO date string (end date for multi-day events)
  time?: string; // "09:00" format (start time)
  endTime?: string; // "17:00" format (end time for multi-day events)
  duration?: number; // in minutes (only for single-day events)
  location?: string;
  recurring?: {
    enabled: boolean;
    intervalDays: number; // Repeat every X days
  };
  createdAt: string;
  deletedAt?: string; // ISO string - when moved to recently deleted
}
