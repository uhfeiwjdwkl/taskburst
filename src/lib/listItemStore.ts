import { List, ListItem } from '@/types/list';

const readLists = (): List[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem('lists') || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const findListItem = (itemId: string, listId?: string) => {
  const lists = readLists();
  const list = listId ? lists.find(candidate => candidate.id === listId) : lists.find(candidate => candidate.items.some(item => item.id === itemId));
  const item = list?.items.find(candidate => candidate.id === itemId);
  return list && item ? { list, item } : null;
};

export const updateStoredListItem = (listId: string, updatedItem: ListItem): List[] => {
  const lists = readLists().map(list =>
    list.id === listId
      ? { ...list, items: list.items.map(item => item.id === updatedItem.id ? updatedItem : item) }
      : list
  );
  localStorage.setItem('lists', JSON.stringify(lists));
  window.dispatchEvent(new Event('listsUpdated'));
  return lists;
};

export const deleteStoredListItem = (listId: string, itemId: string): List[] => {
  const lists = readLists();
  const list = lists.find(candidate => candidate.id === listId);
  const item = list?.items.find(candidate => candidate.id === itemId);
  if (item) {
    let deleted: unknown = [];
    try { deleted = JSON.parse(localStorage.getItem('deletedListItems') || '[]'); } catch { deleted = []; }
    const deletedItems = Array.isArray(deleted) ? deleted : [];
    localStorage.setItem('deletedListItems', JSON.stringify([
      ...deletedItems,
      { ...item, listId, deletedAt: new Date().toISOString() },
    ]));
  }
  const updated = lists.map(candidate =>
    candidate.id === listId
      ? { ...candidate, items: candidate.items.filter(candidateItem => candidateItem.id !== itemId) }
      : candidate
  );
  localStorage.setItem('lists', JSON.stringify(updated));
  window.dispatchEvent(new Event('listsUpdated'));
  return updated;
};