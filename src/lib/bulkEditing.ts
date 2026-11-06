export type BulkField = { key: string; label: string; type: 'text' | 'number' | 'date' | 'datetime-local' | 'time' | 'boolean' | 'json'; options?: string[] };
export const taskBulkFields: BulkField[] = [
  { key: 'name', label: 'Name', type: 'text' }, { key: 'description', label: 'Description', type: 'text' },
  { key: 'category', label: 'Subject', type: 'text' }, { key: 'subcategory', label: 'Subcategory', type: 'text' },
  { key: 'taskType', label: 'Task type', type: 'text', options: ['general','study','revision','practice','homework','reading','writing','research'] },
  ...['importance','estimatedMinutes','spentMinutes','progressGridSize','progressGridFilled','order'].map(key => ({ key, label: ({ importance: 'Importance', estimatedMinutes: 'Estimated minutes', spentMinutes: 'Spent minutes', progressGridSize: 'Progress boxes', progressGridFilled: 'Filled boxes', order: 'Order' } as Record<string,string>)[key], type: 'number' as const })),
  { key: 'dueDate', label: 'Due date', type: 'datetime-local' }, { key: 'scheduledDate', label: 'Scheduled date', type: 'date' }, { key: 'scheduledTime', label: 'Scheduled time', type: 'time' },
  ...['partial','completed','hidden','flagged','showInResults','hiddenInResults'].map(key => ({ key, label: ({ partial:'Partial', completed:'Completed', hidden:'Hidden', flagged:'Flagged', showInResults:'Show in results', hiddenInResults:'Hidden in results' } as Record<string,string>)[key], type:'boolean' as const })),
  { key:'color', label:'Colour', type:'text' }, { key:'instructions', label:'Instructions', type:'text' },
  { key:'projectId', label:'Project', type:'text' }, { key:'resultShortName', label:'Result short name', type:'text' },
  { key:'result', label:'Result', type:'json' }, { key:'subtasks', label:'Subtasks', type:'json' },
];
export const eventBulkFields: BulkField[] = [
  { key:'title', label:'Name', type:'text' }, { key:'description', label:'Description', type:'text' },
  { key:'date', label:'Start date', type:'date' }, { key:'endDate', label:'End date', type:'date' },
  { key:'time', label:'Start time', type:'time' }, { key:'endTime', label:'End time', type:'time' },
  { key:'duration', label:'Duration (minutes)', type:'number' }, { key:'location', label:'Location', type:'text' }, { key:'color', label:'Colour', type:'text' },
  { key:'travelTimeStart', label:'Travel before (minutes)', type:'number' }, { key:'travelTimeEnd', label:'Travel after (minutes)', type:'number' },
  { key:'recurring', label:'Recurrence', type:'json' },
];
export function parseBulkValue(field: BulkField, value: string): unknown {
  if (field.type === 'boolean') return value === 'true';
  if (field.type === 'number') { const n = Number(value); if (!value.trim() || !Number.isFinite(n) || n < 0) throw new Error('Enter a valid non-negative number'); return n; }
  if (field.type === 'json') return value.trim() ? JSON.parse(value) : undefined;
  return value || undefined;
}
export function applyBulkPatch<T extends object>(item: T, key: string, value: unknown): T {
  const next = { ...item, [key]: value } as T & { scheduledDate?: string; scheduledTime?: string; subtasks?: { dueDate?: string; scheduledTime?: string }[] };
  if (key === 'scheduledDate' && !value) next.scheduledTime = undefined;
  if (next.subtasks) next.subtasks = next.subtasks.map(s => s.dueDate ? s : { ...s, scheduledTime: undefined });
  return next;
}