import { Task } from '@/types/task';
import { Assessment } from '@/types/assessment';

export type WeightGroupItemType = 'task' | 'assessment';

export interface WeightGroupItem {
  itemId: string;
  itemType: WeightGroupItemType;
  /** Relative weight of this item inside the group (not a percentage). */
  weight: number;
}

export interface WeightGroup {
  id: string;
  name: string;
  items: WeightGroupItem[];
  /** Hidden groups live in the hidden groups archive section. */
  hidden?: boolean;
  createdAt: string;
}

const KEY = 'weightGroups';

const safeArray = <T,>(key: string): T[] => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

export const getWeightGroups = (): WeightGroup[] =>
  safeArray<WeightGroup>(KEY).map((g) => ({ ...g, items: Array.isArray(g.items) ? g.items : [] }));

export const saveWeightGroups = (groups: WeightGroup[]) => {
  localStorage.setItem(KEY, JSON.stringify(groups));
  window.dispatchEvent(new Event('weightGroupsUpdated'));
};

export const createWeightGroup = (name: string, items: WeightGroupItem[] = []): WeightGroup => {
  const group: WeightGroup = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || 'New group',
    items,
    createdAt: new Date().toISOString(),
  };
  saveWeightGroups([...getWeightGroups(), group]);
  return group;
};

export const updateWeightGroup = (group: WeightGroup) =>
  saveWeightGroups(getWeightGroups().map((g) => (g.id === group.id ? group : g)));

export const deleteWeightGroup = (id: string) =>
  saveWeightGroups(getWeightGroups().filter((g) => g.id !== id));

export const groupsForItem = (itemId: string) =>
  getWeightGroups().filter((g) => g.items.some((i) => i.itemId === itemId));

// -------------------- scoring --------------------

export interface ScorableItem {
  id: string;
  type: WeightGroupItemType;
  name: string;
  /** Percentage achieved, or null when nothing is scored yet. */
  percentage: number | null;
  display: string;
  date?: string;
  category?: string;
}

type PartLike = { score: number | null; maxScore: number; weight?: number };

const scoreParts = (parts: PartLike[], mode?: 'marks' | 'average') => {
  const scored = (parts || []).filter((p) => p.score !== null);
  if (scored.length === 0) return { percentage: null as number | null, display: '—' };
  if (mode === 'average') {
    const totalWeight = scored.reduce((s, p) => s + (p.weight ?? 1), 0) || 1;
    const pct = scored.reduce((s, p) => s + ((p.score || 0) / (p.maxScore || 1)) * 100 * (p.weight ?? 1), 0) / totalWeight;
    return { percentage: pct, display: `${pct.toFixed(1)}%` };
  }
  const total = scored.reduce((s, p) => s + (p.score || 0), 0);
  const max = scored.reduce((s, p) => s + (p.maxScore || 0), 0) || 1;
  return { percentage: (total / max) * 100, display: `${total}/${max}` };
};

/** Every task / assessment that can take part in a weighting group. */
export const getScorableItems = (): ScorableItem[] => {
  const tasks = [...safeArray<Task>('tasks'), ...safeArray<Task>('archivedTasks')];
  const assessments = safeArray<Assessment>('assessments').filter((a) => !a.deletedAt);

  const items: ScorableItem[] = [];
  tasks.forEach((t) => {
    if (!t.result) return;
    const { percentage, display } = scoreParts(t.result.parts as PartLike[], t.result.totalMode);
    items.push({
      id: t.id,
      type: 'task',
      name: t.resultShortName || t.name,
      percentage,
      display,
      date: t.dueDate,
      category: t.category,
    });
  });
  assessments.forEach((a) => {
    const { percentage, display } = scoreParts(a.result.parts as PartLike[], a.result.totalMode);
    items.push({
      id: a.id,
      type: 'assessment',
      name: a.resultShortName || a.name,
      percentage,
      display,
      date: a.dueDate,
      category: a.category,
    });
  });
  return items.sort((a, b) => a.name.localeCompare(b.name));
};

export interface GroupScore {
  percentage: number | null;
  display: string;
  totalWeight: number;
}

export const calculateGroupScore = (group: WeightGroup, all = getScorableItems()): GroupScore => {
  const entries = group.items
    .map((i) => ({ weight: i.weight, item: all.find((s) => s.id === i.itemId && s.type === i.itemType) }))
    .filter((e) => e.item && e.item.percentage !== null) as { weight: number; item: ScorableItem }[];

  const totalWeight = entries.reduce((s, e) => s + (e.weight || 0), 0);
  if (entries.length === 0 || totalWeight === 0) return { percentage: null, display: '—', totalWeight };
  const pct = entries.reduce((s, e) => s + (e.item.percentage as number) * (e.weight || 0), 0) / totalWeight;
  return { percentage: pct, display: `${pct.toFixed(2)}%`, totalWeight };
};
