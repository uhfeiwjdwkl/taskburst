import { AppSettings } from '@/types/settings';

export const getSystemTimezone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Return the effective IANA timezone name (or 'custom') based on settings.
 * If overrideTimezone is off, always returns the system timezone.
 */
export const getActiveTimezone = (settings: Pick<AppSettings, 'overrideTimezone' | 'timezone'>): string => {
  if (!settings?.overrideTimezone) return getSystemTimezone();
  return settings.timezone || getSystemTimezone();
};

/** Always return current UTC ISO string. */
export const nowUtcIso = (): string => new Date().toISOString();

/**
 * Get "now" adjusted so that its wall-clock reading in the LOCAL browser
 * matches the wall-clock time in the target timezone. Useful for clocks.
 */
export const nowInZone = (settings: Pick<AppSettings, 'overrideTimezone' | 'timezone' | 'customUtcOffset'>): Date => {
  if (!settings?.overrideTimezone) return new Date();
  const now = new Date();
  if (settings.timezone === 'custom') {
    const offsetHours = settings.customUtcOffset ?? 0;
    // Convert now → UTC → target offset
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utcMs + offsetHours * 3600000);
  }
  const tz = settings.timezone || getSystemTimezone();
  try {
    // Format now in the target zone, then reparse as if it were local.
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(now).reduce<Record<string, string>>((acc, p) => {
      if (p.type !== 'literal') acc[p.type] = p.value;
      return acc;
    }, {});
    const y = Number(parts.year), mo = Number(parts.month) - 1, d = Number(parts.day);
    const h = Number(parts.hour === '24' ? '0' : parts.hour), mi = Number(parts.minute), s = Number(parts.second);
    return new Date(y, mo, d, h, mi, s);
  } catch {
    return now;
  }
};

/** Format a UTC ISO string into HH:MM (24h) or h:MM AM/PM (12h) in the active tz. */
export const formatTimeInZone = (
  utcIso: string,
  settings: Pick<AppSettings, 'overrideTimezone' | 'timezone' | 'customUtcOffset' | 'timeFormat'>
): string => {
  const d = new Date(utcIso);
  if (isNaN(d.getTime())) return '';
  const use12 = settings.timeFormat === '12h';
  if (settings.overrideTimezone && settings.timezone === 'custom') {
    const offset = settings.customUtcOffset ?? 0;
    const shifted = new Date(d.getTime() + offset * 3600000);
    const hh = shifted.getUTCHours(), mm = shifted.getUTCMinutes();
    if (use12) {
      const period = hh >= 12 ? 'PM' : 'AM';
      const h = ((hh + 11) % 12) + 1;
      return `${h}:${String(mm).padStart(2, '0')} ${period}`;
    }
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  const tz = settings.overrideTimezone ? (settings.timezone || getSystemTimezone()) : getSystemTimezone();
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: use12,
  }).format(d);
};