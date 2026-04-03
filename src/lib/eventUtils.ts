import { addDays, differenceInCalendarDays, eachDayOfInterval, parseISO } from 'date-fns';
import { CalendarEvent } from '@/types/event';

const toDateOnly = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

const safeParseDate = (value?: string) => {
  if (!value) return null;
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : toDateOnly(parsed);
  } catch {
    return null;
  }
};

export const eventOccursOnDate = (event: CalendarEvent, targetDate: Date) => {
  if (event.deletedAt) return false;

  const target = toDateOnly(targetDate);
  const start = safeParseDate(event.date);
  if (!start) return false;

  const end = safeParseDate(event.endDate) || start;
  const spanDays = Math.max(0, differenceInCalendarDays(end, start));
  const recurringInterval = event.recurring?.enabled ? Math.max(1, event.recurring.intervalDays || 1) : null;

  if (!recurringInterval) {
    return target >= start && target <= end;
  }

  if (target < start) return false;

  const diffFromStart = differenceInCalendarDays(target, start);
  const occurrenceIndex = Math.floor(diffFromStart / recurringInterval);
  const occurrenceStart = addDays(start, occurrenceIndex * recurringInterval);
  const occurrenceEnd = addDays(occurrenceStart, spanDays);

  return target >= occurrenceStart && target <= occurrenceEnd;
};

export const getEventDatesForRange = (events: CalendarEvent[], rangeStart: Date, rangeEnd: Date) => {
  const start = toDateOnly(rangeStart);
  const end = toDateOnly(rangeEnd);
  const dates: Date[] = [];

  events.forEach((event) => {
    if (event.deletedAt) return;

    const eventStart = safeParseDate(event.date);
    if (!eventStart) return;

    const eventEnd = safeParseDate(event.endDate) || eventStart;
    const spanDays = Math.max(0, differenceInCalendarDays(eventEnd, eventStart));
    const recurringInterval = event.recurring?.enabled ? Math.max(1, event.recurring.intervalDays || 1) : null;

    if (!recurringInterval) {
      if (eventEnd < start || eventStart > end) return;
      dates.push(
        ...eachDayOfInterval({
          start: eventStart < start ? start : eventStart,
          end: eventEnd > end ? end : eventEnd,
        })
      );
      return;
    }

    for (let occurrenceStart = eventStart; occurrenceStart <= end; occurrenceStart = addDays(occurrenceStart, recurringInterval)) {
      const occurrenceEnd = addDays(occurrenceStart, spanDays);
      if (occurrenceEnd < start) continue;

      dates.push(
        ...eachDayOfInterval({
          start: occurrenceStart < start ? start : occurrenceStart,
          end: occurrenceEnd > end ? end : occurrenceEnd,
        })
      );
    }
  });

  return dates;
};