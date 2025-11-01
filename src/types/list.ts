export interface ListItem {
  id: string;
  title: string;
  priority: number; // 1-5 scale
  completed: boolean;
  dateTime?: string; // ISO string - optional date/time
  notes?: string;
  createdAt: string;
  deletedAt?: string;
}

export interface List {
  id: string;
  title: string;
  description?: string;
  dueDateTime?: string; // ISO string - optional due date/time
  favorite: boolean;
  notes?: string;
  items: ListItem[];
  order: number; // For manual ordering
  createdAt: string;
  archivedAt?: string;
  deletedAt?: string;
}
