import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import { Property } from '@/types/property';

export const generateQRCodeDataURL = async (url: string): Promise<string> => {
  return QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    color: {
      dark: '#0d1629',
      light: '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });
};

export const downloadQRCodePNG = async (property: Property, baseUrl: string): Promise<void> => {
  const url = `${baseUrl}/property/${property.slug}`;
  const dataUrl = await generateQRCodeDataURL(url);
  
  const link = document.createElement('a');
  link.download = `qr-${property.slug}.png`;
  link.href = dataUrl;
  link.click();
};

export const downloadQRCodePDF = async (property: Property, baseUrl: string): Promise<void> => {
  const url = `${baseUrl}/property/${property.slug}`;
  const dataUrl = await generateQRCodeDataURL(url);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Add title
  pdf.setFontSize(24);
  pdf.setTextColor(13, 22, 41);
  pdf.text(property.name, 105, 30, { align: 'center' });
  
  // Add QR code
  const imgWidth = 100;
  const imgHeight = 100;
  const x = (210 - imgWidth) / 2;
  pdf.addImage(dataUrl, 'PNG', x, 50, imgWidth, imgHeight);
  
  // Add URL
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(url, 105, 165, { align: 'center' });
  
  // Add description if exists
  if (property.description) {
    pdf.setFontSize(12);
    pdf.setTextColor(60, 60, 60);
    pdf.text(property.description, 105, 180, { align: 'center', maxWidth: 150 });
  }
  
  // Add footer
  pdf.setFontSize(8);
  pdf.setTextColor(150, 150, 150);
  pdf.text('Escanea el código QR para obtener direcciones', 105, 280, { align: 'center' });
  
  pdf.save(`qr-${property.slug}.pdf`);
};

export const downloadAllQRCodesPDF = async (properties: Property[], baseUrl: string): Promise<void> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    if (!property.isActive) continue;
    
    if (i > 0) {
      pdf.addPage();
    }
    
    const url = `${baseUrl}/property/${property.slug}`;
    const dataUrl = await generateQRCodeDataURL(url);
    
    // Add title
    pdf.setFontSize(24);
    pdf.setTextColor(13, 22, 41);
    pdf.text(property.name, 105, 30, { align: 'center' });
    
    // Add QR code
    const imgWidth = 100;
    const imgHeight = 100;
    const x = (210 - imgWidth) / 2;
    pdf.addImage(dataUrl, 'PNG', x, 50, imgWidth, imgHeight);
    
    // Add URL
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(url, 105, 165, { align: 'center' });
    
    // Add description
    if (property.description) {
      pdf.setFontSize(12);
      pdf.setTextColor(60, 60, 60);
      pdf.text(property.description, 105, 180, { align: 'center', maxWidth: 150 });
    }
    
    // Add footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Escanea el código QR para obtener direcciones', 105, 280, { align: 'center' });
  }
  
  pdf.save('todos-los-codigos-qr.pdf');
};
