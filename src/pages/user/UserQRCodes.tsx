import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Download, MapPin, Loader2, ArrowLeft, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { generateQRCodeDataURL } from '@/lib/qr-generator';
import jsPDF from 'jspdf';

interface Property {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
}

interface QRCodeData {
  property: Property;
  dataUrl: string;
}

const UserQRCodes = () => {
  const { profile, logout } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQRCodes();
  }, [profile]);

  const loadQRCodes = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // Get property IDs assigned to this user
      const { data: accessData, error: accessError } = await supabase
        .from('user_property_access')
        .select('property_id')
        .eq('profile_id', profile.id);

      if (accessError) {
        console.error('Error loading property access:', accessError);
        setLoading(false);
        return;
      }

      if (!accessData || accessData.length === 0) {
        setQrCodes([]);
        setLoading(false);
        return;
      }

      const propertyIds = accessData.map(a => a.property_id);

      // Fetch the actual properties
      const { data: propsData, error: propsError } = await supabase
        .from('properties')
        .select('id, name, slug, latitude, longitude')
        .in('id', propertyIds)
        .eq('is_active', true)
        .order('name');

      if (propsError) {
        console.error('Error loading properties:', propsError);
        setLoading(false);
        return;
      }

      // Generate QR codes for each property
      const qrPromises = (propsData || []).map(async (property) => {
        const url = `${window.location.origin}/property/${property.slug}`;
        const dataUrl = await generateQRCodeDataURL(url);
        return { property, dataUrl };
      });

      const generatedQRs = await Promise.all(qrPromises);
      setQrCodes(generatedQRs);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleDownloadPNG = (qr: QRCodeData) => {
    const link = document.createElement('a');
    link.download = `qr-${qr.property.slug}.png`;
    link.href = qr.dataUrl;
    link.click();
  };

  const handleDownloadPDF = (qr: QRCodeData) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const url = `${window.location.origin}/property/${qr.property.slug}`;

    // Add title
    pdf.setFontSize(24);
    pdf.setTextColor(13, 22, 41);
    pdf.text(qr.property.name, 105, 30, { align: 'center' });

    // Add QR code
    const imgWidth = 100;
    const imgHeight = 100;
    const x = (210 - imgWidth) / 2;
    pdf.addImage(qr.dataUrl, 'PNG', x, 50, imgWidth, imgHeight);

    // Add URL
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(url, 105, 165, { align: 'center' });

    // Add footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Escanea el código QR para obtener direcciones', 105, 280, { align: 'center' });

    pdf.save(`qr-${qr.property.slug}.pdf`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" showText />
          <div className="flex items-center gap-4">
            <Link to="/user/propiedades">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4" />
                Mis Propiedades
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Códigos QR</h1>
          <p className="text-muted-foreground">
            Códigos QR de las propiedades asignadas a tu cuenta. Puedes descargarlos en formato PNG o PDF.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border">
            <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Sin códigos QR disponibles</h3>
            <p className="text-muted-foreground">
              No tienes propiedades asignadas. Contacta al administrador para obtener acceso.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qr) => (
              <div key={qr.property.id} className="bg-card rounded-lg border border-border overflow-hidden">
                {/* QR Preview */}
                <div className="p-6 flex justify-center bg-white">
                  <img 
                    src={qr.dataUrl} 
                    alt={`QR de ${qr.property.name}`}
                    className="w-48 h-48"
                  />
                </div>

                {/* Property Info */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{qr.property.name}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {qr.property.slug}
                  </p>

                  {/* Download Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownloadPNG(qr)}
                    >
                      <Download className="w-4 h-4" />
                      PNG
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleDownloadPDF(qr)}
                    >
                      <Download className="w-4 h-4" />
                      PDF
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserQRCodes;
