export function parseClock(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) throw new Error('Enter a valid time');
  return Number(match[1]) * 60 + Number(match[2]);
}
export function parseDuration(value: string): number {
  if (/^\d+$/.test(value)) return Number(value);
  const match = /^(\d+):(\d{1,2})$/.exec(value);
  if (!match || Number(match[2]) > 59) throw new Error('Enter minutes or hours:minutes');
  return Number(match[1]) * 60 + Number(match[2]);
}
export function calculateTime(start: string, operation: string, amount: string): string {
  const a = parseClock(start);
  if (operation === 'difference') { const d = parseClock(amount) - a; return `${d < 0 ? '−' : ''}${Math.floor(Math.abs(d)/60)}h ${Math.abs(d)%60}m`; }
  const total = a + (operation === 'subtract' ? -1 : 1) * parseDuration(amount);
  const wrapped = ((total % 1440) + 1440) % 1440;
  const day = Math.floor(total / 1440);
  return `${String(Math.floor(wrapped/60)).padStart(2,'0')}:${String(wrapped%60).padStart(2,'0')}${day ? ` (${day > 0 ? '+' : ''}${day} day)` : ''}`;
}
