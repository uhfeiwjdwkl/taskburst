import { Timetable } from "@/types/timetable";
import * as XLSX from 'xlsx';

export const exportToPDF = (timetable: Timetable, currentWeek: 1 | 2 = 1) => {
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
            ${timetable.rows.map((timeSlot, rowIndex) => `
              <tr style="height: 60px;">
                <td class="time-column">${timeSlot.label}<br><small style="color: #888;">${timeSlot.startTime}</small></td>
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
            `).join('')}
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

// Helper function to determine text color based on background
function getContrastColor(hexColor: string): string {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black or white based on luminance
  return luminance > 0.5 ? '#000000' : '#ffffff';
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
    const row: any[] = [`${timeSlot.label} ${timeSlot.startTime}`];
    
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
