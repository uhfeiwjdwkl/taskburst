import { Timetable } from "@/types/timetable";
import * as XLSX from 'xlsx';

export const exportToPDF = (timetable: Timetable) => {
  // Calculate equal cell dimensions
  const colWidth = `${Math.floor(100 / (timetable.columns.length + 1))}%`;
  
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
            padding: 12px; 
            text-align: center; 
            vertical-align: middle;
            width: ${colWidth};
            height: 60px;
            overflow: hidden;
          }
          th { background-color: #f2f2f2; font-weight: bold; }
          .time-column { background-color: #f9f9f9; font-weight: bold; }
          .cell-content { line-height: 1.4; word-wrap: break-word; }
        </style>
      </head>
      <body>
        <h1>${timetable.name}</h1>
        <p style="text-align: center; color: #666;">
          ${timetable.type === 'weekly' ? 'Weekly Timetable' : 'Fortnightly Timetable'}
        </p>
        <table>
          <thead>
            <tr>
              <th style="width: ${colWidth};">Time</th>
              ${timetable.columns.map(day => `<th style="width: ${colWidth};">${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${timetable.rows.map((timeSlot, rowIndex) => `
              <tr style="height: 60px;">
                <td class="time-column" style="width: ${colWidth};">${timeSlot.label}<br><small style="color: #888;">${timeSlot.startTime}</small></td>
                ${timetable.columns.map((_, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const cell = timetable.cells[key];
                  if (cell?.hidden) return '';
                  const bgColor = cell?.color || '#ffffff';
                  const textColor = getContrastColor(bgColor);
                  return `<td style="background-color: ${bgColor}; color: ${textColor}; width: ${colWidth}; height: 60px;" ${cell?.rowSpan ? `rowspan="${cell.rowSpan}"` : ''} ${cell?.colSpan ? `colspan="${cell.colSpan}"` : ''}>
                    <div class="cell-content">${cell?.fields?.filter(f => f).join('<br>') || ''}</div>
                  </td>`;
                }).join('')}
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

export const exportToExcel = (timetable: Timetable) => {
  const wb = XLSX.utils.book_new();
  
  // Create data array for the timetable
  const data: any[][] = [];
  
  // Title and subtitle rows
  data.push([timetable.name]);
  data.push([`${timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'} Timetable`]);
  data.push([]); // Empty row
  
  // Header row
  const headerRow = ['Time', ...timetable.columns];
  data.push(headerRow);
  
  // Data rows
  timetable.rows.forEach((timeSlot, rowIndex) => {
    const row: any[] = [`${timeSlot.label}\n${timeSlot.startTime}`];
    
    timetable.columns.forEach((_, colIndex) => {
      const key = `${rowIndex}-${colIndex}`;
      const cell = timetable.cells[key];
      
      if (!cell?.hidden) {
        const content = cell?.fields?.filter(f => f).join('\n') || '';
        row.push(content);
      }
    });
    
    data.push(row);
  });
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths (equal width for all columns)
  const colWidth = 20; // Width in characters
  ws['!cols'] = Array(timetable.columns.length + 1).fill({ wch: colWidth });
  
  // Set row heights (equal height for data rows)
  const rowHeight = 60; // Height in points
  ws['!rows'] = data.map((_, idx) => {
    if (idx < 3) return { hpt: 20 }; // Title rows
    return { hpt: rowHeight }; // Data rows
  });
  
  // Apply colors to cells
  const cellStyles: any = {};
  timetable.rows.forEach((timeSlot, rowIndex) => {
    timetable.columns.forEach((_, colIndex) => {
      const key = `${rowIndex}-${colIndex}`;
      const cell = timetable.cells[key];
      
      if (cell?.color && !cell?.hidden) {
        const excelRow = rowIndex + 4; // +4 for title rows and header
        const excelCol = colIndex + 1; // +1 for time column
        const cellRef = XLSX.utils.encode_cell({ r: excelRow, c: excelCol });
        
        if (!ws[cellRef]) ws[cellRef] = { v: '' };
        
        // Convert hex to RGB for Excel
        const rgb = hexToRgb(cell.color);
        if (rgb) {
          ws[cellRef].s = {
            fill: {
              fgColor: { rgb: rgb.replace('#', '') }
            },
            alignment: {
              vertical: 'center',
              horizontal: 'center',
              wrapText: true
            },
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
