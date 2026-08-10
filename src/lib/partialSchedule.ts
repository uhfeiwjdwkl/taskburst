export interface PartialSlot {
  id: string;
  itemId: string;
  itemType: 'task' | 'subtask' | 'listItem';
  itemTitle?: string;
  date: string;   // yyyy-MM-dd
  time: string;   // HH:mm
  duration: number; // minutes
  completed?: boolean;
}

export const PARTIAL_KEY = 'partialScheduleSlots';

export const loadPartialSlots = (): PartialSlot[] => {
  try {
    const raw = localStorage.getItem(PARTIAL_KEY);
    const p = raw ? JSON.parse(raw) : [];
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
};

export const savePartialSlots = (slots: PartialSlot[]) =>
  localStorage.setItem(PARTIAL_KEY, JSON.stringify(slots));

export const getPartialSlotsForDate = (dateStr: string): PartialSlot[] =>
  loadPartialSlots().filter((s) => s.date === dateStr && s.time);
