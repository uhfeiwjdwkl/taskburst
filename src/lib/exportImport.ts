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

// All localStorage keys that should be included in export
const ALL_STORAGE_KEYS = [
  // Core data
  'tasks',
  'deletedTasks',
  'archivedTasks',
  'deletedArchive',
  'calendarEvents',
  'timetables',
  'lists',
  'deletedListItems',
  'sessions',
  'deletedSessions',
  'projects',
  'deletedProjects',
  
  // Progress grid indices for non-sequential filling
  'progressGridFilledIndices',
  
  // Results page column names
  'resultsColumnNames',
  
  // Categories
  'categories',
  'subcategories',
  
  // Settings
  'appSettings',
];

export const exportAllData = async () => {
  const zip = new JSZip();
  
  // Get all data from localStorage
  ALL_STORAGE_KEYS.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      zip.file(`${key}.json`, data);
    }
  });
  
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
    
    // Skip unknown keys
    if (!ALL_STORAGE_KEYS.includes(key)) return;
    
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
          } else if (typeof existing === 'object' && typeof incoming === 'object' && !Array.isArray(existing)) {
            // Merge objects (like progressGridFilledIndices, resultsColumnNames)
            const merged = { ...existing, ...incoming };
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
