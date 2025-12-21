import jsPDF from 'jspdf';
import { AccessLog } from '@/types/property';

export const exportToCSV = (logs: AccessLog[], filename: string = 'historial-accesos'): void => {
  const headers = ['Fecha', 'Hora', 'Propiedad', 'Tipo de Dispositivo', 'User Agent'];
  
  const rows = logs.map(log => [
    new Date(log.accessedAt).toLocaleDateString('es-ES'),
    new Date(log.accessedAt).toLocaleTimeString('es-ES'),
    log.propertyName,
    log.deviceType === 'mobile' ? 'Móvil' : log.deviceType === 'tablet' ? 'Tablet' : 'Escritorio',
    `"${log.userAgent.replace(/"/g, '""')}"`,
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};

export const exportToPDF = (logs: AccessLog[], filename: string = 'historial-accesos'): void => {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  // Title
  pdf.setFontSize(20);
  pdf.setTextColor(13, 22, 41);
  pdf.text('Historial de Accesos', 148, 20, { align: 'center' });
  
  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, 148, 28, { align: 'center' });
  
  // Table headers
  const startY = 40;
  const colWidths = [40, 30, 60, 40, 100];
  const headers = ['Fecha', 'Hora', 'Propiedad', 'Dispositivo', 'User Agent'];
  
  pdf.setFillColor(13, 22, 41);
  pdf.rect(10, startY - 6, 277, 10, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  let xPos = 15;
  headers.forEach((header, i) => {
    pdf.text(header, xPos, startY);
    xPos += colWidths[i];
  });
  
  // Table rows
  pdf.setTextColor(60, 60, 60);
  let yPos = startY + 10;
  const maxRows = 20;
  
  logs.slice(0, maxRows).forEach((log, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(245, 247, 250);
      pdf.rect(10, yPos - 5, 277, 8, 'F');
    }
    
    xPos = 15;
    const row = [
      new Date(log.accessedAt).toLocaleDateString('es-ES'),
      new Date(log.accessedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      log.propertyName,
      log.deviceType === 'mobile' ? 'Móvil' : log.deviceType === 'tablet' ? 'Tablet' : 'Escritorio',
      log.userAgent.substring(0, 60) + (log.userAgent.length > 60 ? '...' : ''),
    ];
    
    row.forEach((cell, i) => {
      pdf.text(cell, xPos, yPos);
      xPos += colWidths[i];
    });
    
    yPos += 8;
  });
  
  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text(`Total de registros: ${logs.length}`, 10, 200);
  
  pdf.save(`${filename}.pdf`);
};
