export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string (start date)
  endDate?: string; // ISO date string (end date for multi-day events)
  time?: string; // "09:00" format
  duration?: number; // in minutes
  location?: string;
  recurring?: {
    enabled: boolean;
    intervalDays: number; // Repeat every X days
  };
  createdAt: string;
  deletedAt?: string; // ISO string - when moved to recently deleted
}
