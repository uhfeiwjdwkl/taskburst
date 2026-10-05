export interface DueBand {
  /** Inclusive upper bound in whole days left. Use null for "and above". */
  maxDays: number | null;
  label: string;
  color: string;
}

export interface DueBandSettings {
  overdueColor: string;
  noDueColor: string;
  bands: DueBand[];
}

export const DEFAULT_DUE_BANDS: DueBandSettings = {
  overdueColor: '#7f1d1d',
  noDueColor: '#6b7280',
  bands: [
    { maxDays: 1, label: 'Today / tomorrow', color: '#dc2626' },
    { maxDays: 2, label: '2 days', color: '#ea580c' },
    { maxDays: 5, label: '3–5 days', color: '#eab308' },
    { maxDays: 9, label: '6–9 days', color: '#84cc16' },
    { maxDays: 14, label: '10–14 days', color: '#15803d' },
    { maxDays: 20, label: '15–20 days', color: '#2563eb' },
    { maxDays: null, label: '21+ days', color: '#4f46e5' },
  ],
};

export const daysUntil = (due: string): number | null => {
  const d = new Date(due);
  if (isNaN(d.getTime())) return null;
  const start = new Date(); start.setHours(0, 0, 0, 0);
  const target = new Date(d); target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86400000);
};

export const getDuePill = (due: string | undefined, cfg: DueBandSettings = DEFAULT_DUE_BANDS) => {
  if (!due) return { text: 'No due date', color: cfg.noDueColor };
  const days = daysUntil(due);
  if (days === null) return { text: 'No due date', color: cfg.noDueColor };
  if (days < 0) return { text: `Overdue ${-days}d`, color: cfg.overdueColor };
  const text = days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days} days left`;
  const sorted = [...cfg.bands].sort((a, b) => (a.maxDays ?? Infinity) - (b.maxDays ?? Infinity));
  const band = sorted.find((b) => b.maxDays === null || days <= b.maxDays) || sorted[sorted.length - 1];
  return { text, color: band?.color || cfg.noDueColor };
};
