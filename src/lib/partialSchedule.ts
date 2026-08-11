export interface PartialSlot {
  id: string;
  itemId: string;
  itemType: 'task' | 'subtask' | 'listItem' | 'list';
  itemTitle?: string;
  /** For list / listItem slots: the owning list id. */
  listId?: string;
  note?: string;
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

export const newSlotId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const addPartialSlot = (slot: Omit<PartialSlot, 'id'>): PartialSlot => {
  const created: PartialSlot = { ...slot, id: newSlotId() };
  savePartialSlots([...loadPartialSlots(), created]);
  return created;
};

export const updatePartialSlot = (slot: PartialSlot) => {
  savePartialSlots(loadPartialSlots().map((s) => (s.id === slot.id ? slot : s)));
};

export const deletePartialSlot = (id: string) => {
  savePartialSlots(loadPartialSlots().filter((s) => s.id !== id));
};

export const getPartialSlotsForItem = (itemId: string): PartialSlot[] =>
  loadPartialSlots().filter((s) => s.itemId === itemId);
