import { Timetable, FlexibleEvent } from "@/types/timetable";
import * as XLSX from 'xlsx';

// Storage key for flexible events
const FLEXIBLE_EVENTS_KEY = 'flexibleTimetableEvents';

function getFlexibleEventsForTimetable(timetableId: string): FlexibleEvent[] {
  const saved = localStorage.getItem(FLEXIBLE_EVENTS_KEY);
  if (!saved) return [];
  const allEvents = JSON.parse(saved) as FlexibleEvent[];
  return allEvents.filter(e => e.timetableId === timetableId);
}

export const exportToPDF = (timetable: Timetable, currentWeek: 1 | 2 = 1) => {
  // Handle flexible timetables differently
  if (timetable.mode === 'flexible') {
    exportFlexibleToPDF(timetable, currentWeek);
    return;
  }
  
  const isFortnightly = timetable.type === 'fortnightly';
  
  // For fortnightly, we'll show both weeks side by side
  const numWeeks = isFortnightly ? 2 : 1;
  const totalColumns = numWeeks * timetable.columns.length + 1; // +1 for time column
  
  // Time column should be smaller (10%), rest divided equally
  const timeColWidth = '10%';
  const dataColWidth = `${Math.floor(90 / (totalColumns - 1))}%`;
  
  // Create a simple HTML representation of the timetable with preserved colors
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${timetable.name}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: center; 
            vertical-align: middle;
            height: 60px;
            overflow: visible;
          }
          th { background-color: #f2f2f2; font-weight: bold; }
          .time-column { background-color: #f9f9f9; font-weight: bold; width: ${timeColWidth}; font-size: 11px; }
          .data-cell { width: ${dataColWidth}; }
          .cell-content { line-height: 1.3; word-wrap: break-word; font-size: 12px; }
        </style>
      </head>
      <body>
        <h1>${timetable.name}</h1>
        <p style="text-align: center; color: #666;">
          ${timetable.type === 'weekly' ? 'Weekly Timetable' : 'Fortnightly Timetable'}
        </p>
        <table>
          <thead>
            ${isFortnightly ? `
              <tr>
                <th class="time-column" rowspan="2">Time</th>
                <th colspan="${timetable.columns.length}" class="data-cell" style="background-color: #e8e8e8;">Week 1</th>
                <th colspan="${timetable.columns.length}" class="data-cell" style="background-color: #e8e8e8;">Week 2</th>
              </tr>
              <tr>
                ${timetable.columns.map(day => `<th class="data-cell">${day}</th>`).join('')}
                ${timetable.columns.map(day => `<th class="data-cell">${day}</th>`).join('')}
              </tr>
            ` : `
              <tr>
                <th class="time-column">Time</th>
                ${timetable.columns.map(day => `<th class="data-cell">${day}</th>`).join('')}
              </tr>
            `}
          </thead>
          <tbody>
            ${timetable.rows.map((timeSlot, rowIndex) => {
              // Format time with AM/PM
              const [hours, minutes] = timeSlot.startTime.split(':');
              const hour = parseInt(hours);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
              const formattedTime = `${displayHour}:${minutes} ${ampm}`;
              
              return `
              <tr style="height: 60px;">
                <td class="time-column">${formattedTime}</td>
                ${isFortnightly ?
                  // Week 1 cells
                  timetable.columns.map((_, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const cell = timetable.cells[key];
                    if (cell?.hidden || (cell?.week && cell.week !== 1)) return '<td class="data-cell"></td>';
                    const bgColor = cell?.color || '#ffffff';
                    const textColor = getContrastColor(bgColor);
                    return `<td class="data-cell" style="background-color: ${bgColor}; color: ${textColor};" ${cell?.rowSpan ? `rowspan="${cell.rowSpan}"` : ''} ${cell?.colSpan ? `colspan="${cell.colSpan}"` : ''}>
                      <div class="cell-content">${cell?.fields?.filter(f => f).join('<br>') || ''}</div>
                    </td>`;
                  }).join('') +
                  // Week 2 cells
                  timetable.columns.map((_, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const cell = timetable.cells[key];
                    if (cell?.hidden || (cell?.week && cell.week !== 2)) return '<td class="data-cell"></td>';
                    const bgColor = cell?.color || '#ffffff';
                    const textColor = getContrastColor(bgColor);
                    return `<td class="data-cell" style="background-color: ${bgColor}; color: ${textColor};" ${cell?.rowSpan ? `rowspan="${cell.rowSpan}"` : ''} ${cell?.colSpan ? `colspan="${cell.colSpan}"` : ''}>
                      <div class="cell-content">${cell?.fields?.filter(f => f).join('<br>') || ''}</div>
                    </td>`;
                  }).join('')
                : 
                  // Weekly timetable
                  timetable.columns.map((_, colIndex) => {
                    const key = `${rowIndex}-${colIndex}`;
                    const cell = timetable.cells[key];
                    if (cell?.hidden) return '';
                    const bgColor = cell?.color || '#ffffff';
                    const textColor = getContrastColor(bgColor);
                    return `<td class="data-cell" style="background-color: ${bgColor}; color: ${textColor};" ${cell?.rowSpan ? `rowspan="${cell.rowSpan}"` : ''} ${cell?.colSpan ? `colspan="${cell.colSpan}"` : ''}>
                      <div class="cell-content">${cell?.fields?.filter(f => f).join('<br>') || ''}</div>
                    </td>`;
                  }).join('')
                }
              </tr>
            `;
            }).join('')}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open('', '', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
};

// Export flexible timetable as visual PDF
function exportFlexibleToPDF(timetable: Timetable, currentWeek: 1 | 2 = 1) {
  const events = getFlexibleEventsForTimetable(timetable.id);
  const isFortnightly = timetable.type === 'fortnightly';
  
  const startTime = timetable.flexStartTime || '06:00';
  const endTime = timetable.flexEndTime || '22:00';
  const interval = timetable.flexInterval || 60;
  const timeFormat = timetable.flexTimeFormat || '12h';

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  const startMinutesOfDay = startHour * 60 + startMin;
  
  // Generate time markers
  const timeMarkers: string[] = [];
  for (let m = startHour * 60 + startMin; m <= endHour * 60 + endMin; m += interval) {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    const time24 = `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    if (timeFormat === '24h') {
      timeMarkers.push(time24);
    } else {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 || 12;
      timeMarkers.push(`${displayH}:${mins.toString().padStart(2, '0')} ${period}`);
    }
  }
  
  const formatEventTime = (time: string) => {
    if (timeFormat === '24h') return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };
  
  const rowHeight = 50; // pixels per interval
  const gridHeight = timeMarkers.length * rowHeight;
  
  const getEventStyle = (event: FlexibleEvent) => {
    const [eventStartH, eventStartM] = event.startTime.split(':').map(Number);
    const [eventEndH, eventEndM] = event.endTime.split(':').map(Number);
    const eventStartMins = eventStartH * 60 + eventStartM;
    const eventEndMins = eventEndH * 60 + eventEndM;
    
    const top = ((eventStartMins - startMinutesOfDay) / totalMinutes) * gridHeight;
    const height = ((eventEndMins - eventStartMins) / totalMinutes) * gridHeight;
    
    return { top: Math.max(0, top), height: Math.max(20, height) };
  };
  
  // Build HTML for visual grid
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${timetable.name}</title>
        <style>
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
          h1 { text-align: center; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #666; margin-bottom: 20px; }
          .grid-container { display: flex; border: 1px solid #ddd; }
          .time-column { width: 80px; flex-shrink: 0; border-right: 1px solid #ddd; background: #f9f9f9; }
          .time-marker { height: ${rowHeight}px; display: flex; align-items: flex-start; justify-content: center; font-size: 11px; color: #666; border-top: 1px solid #eee; padding-top: 2px; }
          .days-container { flex: 1; display: grid; grid-template-columns: repeat(${timetable.columns.length}, 1fr); }
          .day-column { border-right: 1px solid #ddd; position: relative; }
          .day-column:last-child { border-right: none; }
          .day-header { height: 40px; display: flex; align-items: center; justify-content: center; font-weight: bold; background: #f2f2f2; border-bottom: 1px solid #ddd; }
          .day-grid { position: relative; height: ${gridHeight}px; }
          .time-line { position: absolute; left: 0; right: 0; border-top: 1px dashed #e0e0e0; }
          .event { position: absolute; left: 4px; right: 4px; border-radius: 4px; padding: 4px 6px; overflow: hidden; font-size: 11px; box-sizing: border-box; }
          .event-title { font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .event-time { font-size: 9px; opacity: 0.8; }
          .week-label { text-align: center; font-size: 12px; margin: 10px 0; color: #666; }
        </style>
      </head>
      <body>
        <h1>${timetable.name}</h1>
        <p class="subtitle">${isFortnightly ? 'Fortnightly Flexible Timetable' : 'Weekly Flexible Timetable'}</p>
        
        ${isFortnightly ? '<div class="week-label">Week 1</div>' : ''}
        <div class="grid-container">
          <div class="time-column">
            <div style="height: 40px;"></div>
            ${timeMarkers.map((time, i) => `<div class="time-marker">${time}</div>`).join('')}
          </div>
          <div class="days-container">
            ${timetable.columns.map((day, dayIndex) => {
              const dayEvents = events.filter(e => 
                e.dayIndex === dayIndex && 
                (!isFortnightly || !e.week || e.week === 1)
              );
              
              return `
                <div class="day-column">
                  <div class="day-header">${day.slice(0, 3)}</div>
                  <div class="day-grid">
                    ${timeMarkers.map((_, i) => `<div class="time-line" style="top: ${i * rowHeight}px;"></div>`).join('')}
                    ${dayEvents.map(event => {
                      const style = getEventStyle(event);
                      const bgColor = event.color || '#8b5cf6';
                      const textColor = getContrastColor(bgColor);
                      return `
                        <div class="event" style="top: ${style.top}px; height: ${style.height}px; background-color: ${bgColor}30; border-left: 3px solid ${bgColor}; color: ${textColor === '#ffffff' ? bgColor : textColor};">
                          <div class="event-title">${event.title}</div>
                          <div class="event-time">${formatEventTime(event.startTime)} - ${formatEventTime(event.endTime)}</div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        
        ${isFortnightly ? `
          <div class="week-label" style="margin-top: 30px;">Week 2</div>
          <div class="grid-container">
            <div class="time-column">
              <div style="height: 40px;"></div>
              ${timeMarkers.map((time, i) => `<div class="time-marker">${time}</div>`).join('')}
            </div>
            <div class="days-container">
              ${timetable.columns.map((day, dayIndex) => {
                const dayEvents = events.filter(e => e.dayIndex === dayIndex && e.week === 2);
                
                return `
                  <div class="day-column">
                    <div class="day-header">${day.slice(0, 3)}</div>
                    <div class="day-grid">
                      ${timeMarkers.map((_, i) => `<div class="time-line" style="top: ${i * rowHeight}px;"></div>`).join('')}
                      ${dayEvents.map(event => {
                        const style = getEventStyle(event);
                        const bgColor = event.color || '#8b5cf6';
                        const textColor = getContrastColor(bgColor);
                        return `
                          <div class="event" style="top: ${style.top}px; height: ${style.height}px; background-color: ${bgColor}30; border-left: 3px solid ${bgColor}; color: ${textColor === '#ffffff' ? bgColor : textColor};">
                            <div class="event-title">${event.title}</div>
                            <div class="event-time">${formatEventTime(event.startTime)} - ${formatEventTime(event.endTime)}</div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </body>
    </html>
  `;

  const printWindow = window.open('', '', 'width=900,height=700');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}

// Helper function to determine text color based on background
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#000000';
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Export flexible timetable to JSON with all event data
export function exportFlexibleToJSON(timetable: Timetable): string {
  const events = getFlexibleEventsForTimetable(timetable.id);
  
  const exportData = {
    id: timetable.id,
    name: timetable.name,
    type: timetable.type,
    mode: timetable.mode,
    columns: timetable.columns,
    colorKey: timetable.colorKey,
    customColors: timetable.customColors,
    flexStartTime: timetable.flexStartTime,
    flexEndTime: timetable.flexEndTime,
    flexInterval: timetable.flexInterval,
    flexTimeFormat: timetable.flexTimeFormat,
    fortnightStartDate: timetable.fortnightStartDate,
    createdAt: timetable.createdAt,
    events: events.map(e => ({
      id: e.id,
      dayIndex: e.dayIndex,
      startTime: e.startTime,
      endTime: e.endTime,
      title: e.title,
      description: e.description,
      fields: e.fields,
      color: e.color,
      week: e.week,
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
}

// Download flexible timetable as JSON file
export function downloadFlexibleJSON(timetable: Timetable) {
  const json = exportFlexibleToJSON(timetable);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${timetable.name.replace(/\s+/g, '_')}_flexible.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Import flexible timetable events from JSON
export function importFlexibleFromJSON(jsonData: any, newTimetableId: string): FlexibleEvent[] {
  if (!jsonData.events || !Array.isArray(jsonData.events)) {
    return [];
  }
  
  return jsonData.events.map((e: any) => ({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    timetableId: newTimetableId,
    dayIndex: e.dayIndex,
    startTime: e.startTime,
    endTime: e.endTime,
    title: e.title || 'Untitled',
    description: e.description,
    fields: e.fields || [],
    color: e.color,
    week: e.week,
  }));
}

export const exportToExcel = (timetable: Timetable, currentWeek: 1 | 2 = 1) => {
  const wb = XLSX.utils.book_new();
  const isFortnightly = timetable.type === 'fortnightly';
  
  // Create data array for the timetable
  const data: any[][] = [];
  
  // Title and subtitle rows
  data.push([timetable.name]);
  data.push([`${timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'} Timetable`]);
  data.push([]); // Empty row
  
  if (isFortnightly) {
    // For fortnightly, create header with week labels
    const weekHeaderRow = ['Time', ...Array(timetable.columns.length).fill('Week 1'), ...Array(timetable.columns.length).fill('Week 2')];
    data.push(weekHeaderRow);
    
    // Day headers
    const dayHeaderRow = ['', ...timetable.columns, ...timetable.columns];
    data.push(dayHeaderRow);
  } else {
    // For weekly, simple header
    const headerRow = ['Time', ...timetable.columns];
    data.push(headerRow);
  }
  
  // Data rows
  timetable.rows.forEach((timeSlot, rowIndex) => {
    // Format time with AM/PM
    const [hours, minutes] = timeSlot.startTime.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const formattedTime = `${displayHour}:${minutes} ${ampm}`;
    
    const row: any[] = [formattedTime];
    
    if (isFortnightly) {
      // Week 1 cells
      timetable.columns.forEach((_, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        const cell = timetable.cells[key];
        
        if (!cell?.hidden && (!cell?.week || cell.week === 1)) {
          const content = cell?.fields?.filter(f => f).join('\n') || '';
          row.push(content);
        } else {
          row.push('');
        }
      });
      
      // Week 2 cells
      timetable.columns.forEach((_, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        const cell = timetable.cells[key];
        
        if (!cell?.hidden && (!cell?.week || cell.week === 2)) {
          const content = cell?.fields?.filter(f => f).join('\n') || '';
          row.push(content);
        } else {
          row.push('');
        }
      });
    } else {
      // Weekly timetable
      timetable.columns.forEach((_, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        const cell = timetable.cells[key];
        
        if (!cell?.hidden) {
          const content = cell?.fields?.filter(f => f).join('\n') || '';
          row.push(content);
        }
      });
    }
    
    data.push(row);
  });
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths (equal width for all columns)
  const colWidth = 20; // Width in characters
  const totalCols = isFortnightly ? (timetable.columns.length * 2 + 1) : (timetable.columns.length + 1);
  ws['!cols'] = Array(totalCols).fill({ wch: colWidth });
  
  // Set row heights (equal height for data rows)
  const rowHeight = 60; // Height in points
  ws['!rows'] = data.map((_, idx) => {
    if (idx < 3) return { hpt: 20 }; // Title rows
    return { hpt: rowHeight }; // Data rows
  });
  
  // Merge cells for week headers if fortnightly
  if (isFortnightly) {
    ws['!merges'] = [
      { s: { r: 3, c: 1 }, e: { r: 3, c: timetable.columns.length } }, // Week 1
      { s: { r: 3, c: timetable.columns.length + 1 }, e: { r: 3, c: timetable.columns.length * 2 } } // Week 2
    ];
  }
  
  // Apply colors to cells
  const headerRowOffset = isFortnightly ? 5 : 4; // Account for extra header row in fortnightly
  
  timetable.rows.forEach((timeSlot, rowIndex) => {
    if (isFortnightly) {
      // Week 1 cells
      timetable.columns.forEach((_, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        const cell = timetable.cells[key];
        
        if (cell?.color && !cell?.hidden && (!cell?.week || cell.week === 1)) {
          const excelRow = rowIndex + headerRowOffset;
          const excelCol = colIndex + 1;
          const cellRef = XLSX.utils.encode_cell({ r: excelRow, c: excelCol });
          
          if (!ws[cellRef]) ws[cellRef] = { v: '' };
          
          const rgb = hexToRgb(cell.color);
          if (rgb) {
            ws[cellRef].s = {
              fill: { fgColor: { rgb: rgb.replace('#', '') } },
              alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              }
            };
          }
        }
      });
      
      // Week 2 cells
      timetable.columns.forEach((_, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        const cell = timetable.cells[key];
        
        if (cell?.color && !cell?.hidden && (!cell?.week || cell.week === 2)) {
          const excelRow = rowIndex + headerRowOffset;
          const excelCol = colIndex + 1 + timetable.columns.length;
          const cellRef = XLSX.utils.encode_cell({ r: excelRow, c: excelCol });
          
          if (!ws[cellRef]) ws[cellRef] = { v: '' };
          
          const rgb = hexToRgb(cell.color);
          if (rgb) {
            ws[cellRef].s = {
              fill: { fgColor: { rgb: rgb.replace('#', '') } },
              alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              }
            };
          }
        }
      });
    } else {
      // Weekly timetable
      timetable.columns.forEach((_, colIndex) => {
        const key = `${rowIndex}-${colIndex}`;
        const cell = timetable.cells[key];
        
        if (cell?.color && !cell?.hidden) {
          const excelRow = rowIndex + headerRowOffset;
          const excelCol = colIndex + 1;
          const cellRef = XLSX.utils.encode_cell({ r: excelRow, c: excelCol });
          
          if (!ws[cellRef]) ws[cellRef] = { v: '' };
          
          const rgb = hexToRgb(cell.color);
          if (rgb) {
            ws[cellRef].s = {
              fill: { fgColor: { rgb: rgb.replace('#', '') } },
              alignment: { vertical: 'center', horizontal: 'center', wrapText: true },
              border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
              }
            };
          }
        }
      });
    }
  });
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
  
  // Generate and download file
  XLSX.writeFile(wb, `${timetable.name.replace(/\s+/g, '_')}_timetable.xlsx`);
};

function hexToRgb(hex: string): string | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? `${parseInt(result[1], 16).toString(16).padStart(2, '0')}${parseInt(result[2], 16).toString(16).padStart(2, '0')}${parseInt(result[3], 16).toString(16).padStart(2, '0')}`
    : null;
}
