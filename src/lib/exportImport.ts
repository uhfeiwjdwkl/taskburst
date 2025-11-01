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
  const events = localStorage.getItem('calendarEvents') || '[]';
  const timetables = localStorage.getItem('timetables') || '[]';
  const lists = localStorage.getItem('lists') || '[]';
  const history = localStorage.getItem('history') || '[]';
  
  // Add files to zip
  zip.file('tasks.json', tasks);
  zip.file('deletedTasks.json', deletedTasks);
  zip.file('archivedTasks.json', archivedTasks);
  zip.file('events.json', events);
  zip.file('timetables.json', timetables);
  zip.file('lists.json', lists);
  zip.file('history.json', history);
  
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
