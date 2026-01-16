import jsPDF from 'jspdf';
import { AccessLog } from '@/types/property';
import { PropertyLote } from '@/lib/storage';

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

// ==========================================
// Lotes/Casas Export Functions
// ==========================================

export const exportLotesToCSV = (lotes: PropertyLote[], propertyName: string): void => {
  const headers = ['Número', 'Tipo', 'Latitud', 'Longitud', 'URL de Imagen'];
  
  const rows = lotes.map(lote => [
    lote.numero,
    lote.tipo === 'casa' ? 'Casa' : 'Lote',
    lote.latitude.toString(),
    lote.longitude.toString(),
    lote.imageUrl || 'Sin imagen',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  
  const sanitizedName = propertyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `reporte-lotes-${sanitizedName}.csv`;
  link.click();
};

export const exportLotesToPDF = async (lotes: PropertyLote[], propertyName: string): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Title
  pdf.setFontSize(18);
  pdf.setTextColor(13, 22, 41);
  pdf.text(`Reporte de Lotes/Casas`, pageWidth / 2, 20, { align: 'center' });
  
  // Property name
  pdf.setFontSize(14);
  pdf.setTextColor(60, 60, 60);
  pdf.text(propertyName, pageWidth / 2, 28, { align: 'center' });
  
  // Date
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`, pageWidth / 2, 36, { align: 'center' });
  
  // Table headers
  const startY = 48;
  const colWidths = [25, 25, 45, 45, 50];
  const headers = ['Número', 'Tipo', 'Latitud', 'Longitud', 'Imagen'];
  
  pdf.setFillColor(13, 22, 41);
  pdf.rect(10, startY - 6, pageWidth - 20, 10, 'F');
  
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  let xPos = 15;
  headers.forEach((header, i) => {
    pdf.text(header, xPos, startY);
    xPos += colWidths[i];
  });
  
  // Table rows
  pdf.setTextColor(60, 60, 60);
  let yPos = startY + 12;
  const rowHeight = 20;
  const maxRowsPerPage = 10;
  
  for (let i = 0; i < lotes.length; i++) {
    const lote = lotes[i];
    
    // Check if we need a new page
    if (i > 0 && i % maxRowsPerPage === 0) {
      pdf.addPage();
      yPos = 20;
      
      // Reprint headers on new page
      pdf.setFillColor(13, 22, 41);
      pdf.rect(10, yPos - 6, pageWidth - 20, 10, 'F');
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      xPos = 15;
      headers.forEach((header, j) => {
        pdf.text(header, xPos, yPos);
        xPos += colWidths[j];
      });
      pdf.setTextColor(60, 60, 60);
      yPos += 12;
    }
    
    // Alternating row background
    if (i % 2 === 0) {
      pdf.setFillColor(245, 247, 250);
      pdf.rect(10, yPos - 5, pageWidth - 20, rowHeight, 'F');
    }
    
    xPos = 15;
    
    // Number
    pdf.text(lote.numero, xPos, yPos + 5);
    xPos += colWidths[0];
    
    // Type
    pdf.text(lote.tipo === 'casa' ? 'Casa' : 'Lote', xPos, yPos + 5);
    xPos += colWidths[1];
    
    // Latitude
    pdf.text(lote.latitude.toFixed(6), xPos, yPos + 5);
    xPos += colWidths[2];
    
    // Longitude
    pdf.text(lote.longitude.toFixed(6), xPos, yPos + 5);
    xPos += colWidths[3];
    
    // Image
    if (lote.imageUrl) {
      try {
        // Load image and add to PDF
        const img = await loadImage(lote.imageUrl);
        pdf.addImage(img, 'JPEG', xPos, yPos - 3, 15, 15);
      } catch (error) {
        pdf.text('Error', xPos, yPos + 5);
      }
    } else {
      pdf.text('Sin imagen', xPos, yPos + 5);
    }
    
    yPos += rowHeight;
  }
  
  // Footer
  const totalPages = Math.ceil(lotes.length / maxRowsPerPage);
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Total: ${lotes.length} lotes/casas | Página ${p} de ${totalPages}`, 10, pdf.internal.pageSize.getHeight() - 10);
  }
  
  const sanitizedName = propertyName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  pdf.save(`reporte-lotes-${sanitizedName}.pdf`);
};

// Helper function to load images for PDF
const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
};
