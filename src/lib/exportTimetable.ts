import { Timetable } from "@/types/timetable";

export const exportToPDF = (timetable: Timetable) => {
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
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; vertical-align: middle; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .time-column { background-color: #f9f9f9; font-weight: bold; }
          .cell-content { line-height: 1.4; }
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
              <th>Time</th>
              ${timetable.columns.map(day => `<th>${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${timetable.rows.map((timeSlot, rowIndex) => `
              <tr>
                <td class="time-column">${timeSlot.label}<br><small style="color: #888;">${timeSlot.startTime}</small></td>
                ${timetable.columns.map((_, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const cell = timetable.cells[key];
                  if (cell?.hidden) return '';
                  const bgColor = cell?.color || '#ffffff';
                  const textColor = getContrastColor(bgColor);
                  return `<td style="background-color: ${bgColor}; color: ${textColor};" ${cell?.rowSpan ? `rowspan="${cell.rowSpan}"` : ''} ${cell?.colSpan ? `colspan="${cell.colSpan}"` : ''}>
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
  // Create HTML table for Excel (Excel can open HTML with colors)
  let html = `
    <html xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; }
          th, td { border: 1px solid #000; padding: 8px; text-align: center; }
          th { background-color: #f2f2f2; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2>${timetable.name}</h2>
        <p>${timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'} Timetable</p>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              ${timetable.columns.map(day => `<th>${day}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
  `;

  // Data rows with colors
  timetable.rows.forEach((timeSlot, rowIndex) => {
    html += '<tr>';
    html += `<td style="background-color: #f9f9f9; font-weight: bold;">${timeSlot.label}<br>${timeSlot.startTime}</td>`;
    
    timetable.columns.forEach((_, colIndex) => {
      const key = `${rowIndex}-${colIndex}`;
      const cell = timetable.cells[key];
      
      if (cell?.hidden) return;
      
      const bgColor = cell?.color || '#ffffff';
      const content = cell?.fields?.filter(f => f).join('<br>') || '';
      const rowspan = cell?.rowSpan ? ` rowspan="${cell.rowSpan}"` : '';
      const colspan = cell?.colSpan ? ` colspan="${cell.colSpan}"` : '';
      
      html += `<td style="background-color: ${bgColor};"${rowspan}${colspan}>${content}</td>`;
    });
    
    html += '</tr>';
  });

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Create and download HTML file (Excel will open it with colors preserved)
  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${timetable.name.replace(/\s+/g, '_')}_timetable.xls`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};