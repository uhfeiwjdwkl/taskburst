import { Timetable } from "@/types/timetable";

export const exportToPDF = (timetable: Timetable) => {
  // Create a simple HTML representation of the timetable
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${timetable.name}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .time-column { background-color: #f9f9f9; font-weight: bold; }
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
                <td class="time-column">${timeSlot.label}</td>
                ${timetable.columns.map((_, colIndex) => {
                  const key = `${rowIndex}-${colIndex}`;
                  const cell = timetable.cells[key];
                  if (cell?.hidden) return '';
                  const style = cell?.color ? `background-color: ${cell.color};` : '';
                  return `<td style="${style}" ${cell?.rowSpan ? `rowspan="${cell.rowSpan}"` : ''} ${cell?.colSpan ? `colspan="${cell.colSpan}"` : ''}>
                    ${cell?.fields?.filter(f => f).join('<br>') || ''}
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

export const exportToExcel = (timetable: Timetable) => {
  // Create CSV content
  let csv = `${timetable.name}\n`;
  csv += `${timetable.type === 'weekly' ? 'Weekly' : 'Fortnightly'} Timetable\n\n`;
  
  // Header row
  csv += `Time,${timetable.columns.join(',')}\n`;
  
  // Data rows
  timetable.rows.forEach((timeSlot, rowIndex) => {
    let row = `"${timeSlot.label}"`;
    timetable.columns.forEach((_, colIndex) => {
      const key = `${rowIndex}-${colIndex}`;
      const cell = timetable.cells[key];
      const content = cell?.fields?.filter(f => f).join(' | ') || '';
      row += `,"${content}"`;
    });
    csv += row + '\n';
  });

  // Create and download CSV file
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${timetable.name.replace(/\s+/g, '_')}_timetable.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};