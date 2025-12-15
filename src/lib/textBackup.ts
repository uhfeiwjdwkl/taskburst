export interface TextBackup {
  id: string;
  fieldId: string; // Unique identifier for the text field (e.g., "task-123-description")
  fieldLabel: string; // Human-readable label
  previousContent: string;
  savedAt: string;
  sourceType: 'task' | 'project' | 'list' | 'event' | 'list-item' | 'timetable';
  sourceId: string;
  sourceName: string;
  hidden?: boolean; // Hidden when parent item is deleted (recoverable)
}

const STORAGE_KEY = 'textBackups';

export function getTextBackups(includeHidden = false): TextBackup[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  const backups: TextBackup[] = stored ? JSON.parse(stored) : [];
  return includeHidden ? backups : backups.filter(b => !b.hidden);
}

export function hideTextBackupsForSource(sourceId: string): void {
  const backups = getTextBackups(true);
  const updated = backups.map(b => 
    b.sourceId === sourceId ? { ...b, hidden: true } : b
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function restoreTextBackupsForSource(sourceId: string): void {
  const backups = getTextBackups(true);
  const updated = backups.map(b => 
    b.sourceId === sourceId ? { ...b, hidden: false } : b
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function saveTextBackup(backup: Omit<TextBackup, 'id' | 'savedAt'>): void {
  const backups = getTextBackups();
  
  // Find existing backup for this field
  const existingIndex = backups.findIndex(b => b.fieldId === backup.fieldId);
  
  const newBackup: TextBackup = {
    ...backup,
    id: Date.now().toString(),
    savedAt: new Date().toISOString(),
  };
  
  if (existingIndex !== -1) {
    // Replace existing backup
    backups[existingIndex] = newBackup;
  } else {
    // Add new backup
    backups.push(newBackup);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(backups));
}

export function deleteTextBackup(backupId: string): void {
  const backups = getTextBackups().filter(b => b.id !== backupId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(backups));
}

export function clearTextBackups(): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
}

// Helper to create a unique field ID
export function createFieldId(sourceType: string, sourceId: string, fieldName: string): string {
  return `${sourceType}-${sourceId}-${fieldName}`;
}
