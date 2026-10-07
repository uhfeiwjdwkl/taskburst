import { CalendarEvent } from '@/types/event';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { formatTimeTo12Hour } from '@/lib/dateFormat';

export const MIN_EVENT_MINUTES = 5;
// Two fixed text lines (16px + 14px) with equal 2px top/bottom padding.
export const EVENT_TEXT_HEIGHT = 34;
export const timelinePixelsPerMinute = (readableMinutes = 5) =>
  EVENT_TEXT_HEIGHT / Math.max(1, Math.min(60, Number(readableMinutes) || 5));
export const TIMELINE_PIXELS_PER_MINUTE = timelinePixelsPerMinute();
export const clockMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};
export const minuteClock = (minutes: number) => {
  const value = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
};
export const eventDuration = (event: CalendarEvent) => {
  if (!event.time) return undefined;
  if (event.endDate && event.endTime) {
    return Math.max(0, differenceInCalendarDays(parseISO(event.endDate), parseISO(event.date)) * 1440 + clockMinutes(event.endTime) - clockMinutes(event.time));
  }
  if (event.duration !== undefined) return Math.max(0, event.duration);
  if (event.endTime) return (clockMinutes(event.endTime) - clockMinutes(event.time) + 1440) % 1440;
  return 60;
};
export const eventTimingLabel = (event: CalendarEvent) => {
  if (!event.time) return 'All day';
  const start = clockMinutes(event.time);
  const duration = eventDuration(event) ?? 0;
  const end = start + duration;
  const before = Math.max(0, event.travelTimeStart || 0);
  const after = Math.max(0, event.travelTimeEnd || 0);
  const time = (minutes: number) => formatTimeTo12Hour(minuteClock(minutes));
  return `${time(start)}–${time(end)} · ${duration}m${before || after ? ` (${time(start - before)}–${time(end + after)})` : ''}`;
};