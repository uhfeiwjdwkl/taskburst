import { Term } from '@/types/settings';

/** Read the configured semester / year ranges from app settings. */
export const getTerms = (): Term[] => {
  try {
    const raw = localStorage.getItem('appSettings');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const terms = parsed?.terms;
    return Array.isArray(terms) ? (terms as Term[]) : [];
  } catch {
    return [];
  }
};

export const saveTerms = (terms: Term[]) => {
  let settings: Record<string, unknown> = {};
  try {
    const raw = localStorage.getItem('appSettings');
    settings = raw ? JSON.parse(raw) || {} : {};
  } catch {
    settings = {};
  }
  settings.terms = terms;
  localStorage.setItem('appSettings', JSON.stringify(settings));
  window.dispatchEvent(new Event('appSettingsUpdated'));
};

const dayOf = (value?: string) => (value ? value.slice(0, 10) : '');

/** The term a date falls inside, if any. */
export const termForDate = (date?: string, terms = getTerms()): Term | null => {
  const d = dayOf(date);
  if (!d) return null;
  return terms.find((t) => dayOf(t.start) <= d && d <= dayOf(t.end)) || null;
};

/** Label used when grouping by term. */
export const termLabel = (date?: string, terms = getTerms()): string =>
  termForDate(date, terms)?.name || 'Unassigned period';

/**
 * Filter helper: `all` matches everything, otherwise the date must land in
 * the selected term.
 */
export const matchesTerm = (date: string | undefined, termId: string, terms = getTerms()): boolean => {
  if (!termId || termId === 'all') return true;
  const term = terms.find((t) => t.id === termId);
  if (!term) return true;
  const d = dayOf(date);
  if (!d) return false;
  return dayOf(term.start) <= d && d <= dayOf(term.end);
};
