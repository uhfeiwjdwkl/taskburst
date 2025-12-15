import JSZip from 'jszip';

export const exportData = (data: any, filename: string) => {
  const dataStr = JSON.stringify(data, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importData = (file: File): Promise<any> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};

export const exportAllData = async () => {
  const zip = new JSZip();
  
  // Get all data from localStorage
  const tasks = localStorage.getItem('tasks') || '[]';
  const deletedTasks = localStorage.getItem('deletedTasks') || '[]';
  const archivedTasks = localStorage.getItem('archivedTasks') || '[]';
  const deletedArchive = localStorage.getItem('deletedArchive') || '[]';
  const events = localStorage.getItem('calendarEvents') || '[]';
  const timetables = localStorage.getItem('timetables') || '[]';
  const lists = localStorage.getItem('lists') || '[]';
  const deletedListItems = localStorage.getItem('deletedListItems') || '[]';
  const sessions = localStorage.getItem('sessions') || '[]';
  const deletedSessions = localStorage.getItem('deletedSessions') || '[]';
  
  // Add files to zip
  zip.file('tasks.json', tasks);
  zip.file('deletedTasks.json', deletedTasks);
  zip.file('archivedTasks.json', archivedTasks);
  zip.file('deletedArchive.json', deletedArchive);
  zip.file('events.json', events);
  zip.file('timetables.json', timetables);
  zip.file('lists.json', lists);
  zip.file('deletedListItems.json', deletedListItems);
  zip.file('sessions.json', sessions);
  zip.file('deletedSessions.json', deletedSessions);
  
  // Generate zip
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `taskburst-all-data-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const importAllData = async (file: File, merge = true): Promise<void> => {
  const zip = await JSZip.loadAsync(file);
  
  const filePromises = Object.keys(zip.files).map(async (filename) => {
    const content = await zip.files[filename].async('string');
    const key = filename.replace('.json', '');
    
    if (merge) {
      // Merge with existing data instead of replacing
      const existingData = localStorage.getItem(key);
      if (existingData) {
        try {
          const existing = JSON.parse(existingData);
          const incoming = JSON.parse(content);
          
          if (Array.isArray(existing) && Array.isArray(incoming)) {
            // Merge arrays, avoiding duplicates by ID
            const existingIds = new Set(existing.map((item: any) => item.id));
            const merged = [...existing, ...incoming.filter((item: any) => !existingIds.has(item.id))];
            localStorage.setItem(key, JSON.stringify(merged));
            return;
          }
        } catch {
          // If parsing fails, just set the new content
        }
      }
    }
    
    localStorage.setItem(key, content);
  });
  
  await Promise.all(filePromises);
};

// Helper function to merge imported data with existing data
export const mergeImportedData = <T extends { id: string }>(
  existing: T[],
  incoming: T[]
): T[] => {
  const existingIds = new Set(existing.map(item => item.id));
  return [...existing, ...incoming.filter(item => !existingIds.has(item.id))];
};
