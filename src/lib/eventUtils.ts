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
  const recurringEnd = event.recurring?.enabled ? safeParseDate(event.recurring.endDate) : null;

  if (!recurringInterval) {
    return target >= start && target <= end;
  }

  if (target < start) return false;
  if (recurringEnd && target > recurringEnd) return false;

  const diffFromStart = differenceInCalendarDays(target, start);
  const occurrenceIndex = Math.floor(diffFromStart / recurringInterval);
  const occurrenceStart = addDays(start, occurrenceIndex * recurringInterval);
  const occurrenceEnd = addDays(occurrenceStart, spanDays);

  return target >= occurrenceStart && target <= occurrenceEnd;
};

const parseHHMM = (t?: string): number | null => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

/**
 * Returns the displayed time/duration for a multi-day event on a given target date.
 * - Single-day events: returns the event's own time/duration.
 * - Multi-day with start/end times: spans full days, clipped at start/end.
 * - Multi-day without times: returns null (treat as all-day).
 */
export const getEventTimeSpanForDate = (
  event: CalendarEvent,
  targetDate: Date
): { time?: string; duration?: number } => {
  const start = safeParseDate(event.date);
  const target = toDateOnly(targetDate);
  if (!start) return { time: event.time, duration: event.duration };

  const end = safeParseDate(event.endDate);
  const isMultiDay = !!end && differenceInCalendarDays(end, start) > 0;
  if (!isMultiDay) return { time: event.time, duration: event.duration };

  // For recurring multi-day events, project the target onto the matching occurrence.
  const spanDays = differenceInCalendarDays(end!, start);
  const recurringInterval = event.recurring?.enabled ? Math.max(1, event.recurring.intervalDays || 1) : null;
  let occStart = start;
  let occEnd = end!;
  if (recurringInterval) {
    const diffFromStart = differenceInCalendarDays(target, start);
    if (diffFromStart >= 0) {
      const idx = Math.floor(diffFromStart / recurringInterval);
      occStart = addDays(start, idx * recurringInterval);
      occEnd = addDays(occStart, spanDays);
    }
  }

  const startMin = parseHHMM(event.time);
  const endMin = parseHHMM(event.endTime);

  // No times set -> all-day on every day in span
  if (startMin === null && endMin === null) return {};

  const isStart = target.getTime() === occStart.getTime();
  const isEnd = target.getTime() === occEnd.getTime();

  if (isStart && isEnd) {
    if (startMin !== null && endMin !== null) {
      return { time: event.time, duration: Math.max(1, endMin - startMin) };
    }
    return { time: event.time, duration: event.duration };
  }

  if (isStart) {
    if (startMin === null) return {};
    return { time: event.time, duration: Math.max(1, 24 * 60 - startMin) };
  }

  if (isEnd) {
    if (endMin === null) return {};
    return { time: '00:00', duration: Math.max(1, endMin) };
  }

  // Intermediate day: full 24h block
  return { time: '00:00', duration: 24 * 60 };
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
    const recurringEnd = event.recurring?.enabled ? safeParseDate(event.recurring.endDate) : null;

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

    const loopEnd = recurringEnd && recurringEnd < end ? recurringEnd : end;
    for (let occurrenceStart = eventStart; occurrenceStart <= loopEnd; occurrenceStart = addDays(occurrenceStart, recurringInterval)) {
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