export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  time?: string; // "09:00" format
  duration?: number; // in minutes
  location?: string;
  createdAt: string;
  deletedAt?: string; // ISO string - when moved to recently deleted
}
