import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Download,
  FileText,
  Image,
  QrCode,
  LogOut,
  Loader2,
  Navigation,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { getProperties, Property } from '@/lib/storage';
import { generateQRCodeDataURL, downloadQRCodePNG, downloadQRCodePDF, downloadAllQRCodesPDF } from '@/lib/qr-generator';
import { useToast } from '@/hooks/use-toast';
import { AdminNav } from '@/components/admin/AdminNav';

const AdminQRCodes = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [qrCodes, setQrCodes] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const baseUrl = window.location.origin;

  useEffect(() => {
    loadQRCodes();
  }, []);

  const loadQRCodes = async () => {
    const props = await getProperties();
    const activeProps = props.filter((p: Property) => p.isActive);
    setProperties(activeProps);

    const codes: { [key: string]: string } = {};
    for (const prop of activeProps) {
      const url = `${baseUrl}/property/${prop.slug}`;
      codes[prop.id] = await generateQRCodeDataURL(url);
    }
    setQrCodes(codes);
    setLoading(false);
  };

  const handleDownloadPNG = async (property: Property) => {
    await downloadQRCodePNG(property as any, baseUrl);
    toast({
      title: 'Descarga exitosa',
      description: `QR de ${property.name} descargado como PNG.`,
    });
  };

  const handleDownloadPDF = async (property: Property) => {
    await downloadQRCodePDF(property as any, baseUrl);
    toast({
      title: 'Descarga exitosa',
      description: `QR de ${property.name} descargado como PDF.`,
    });
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    await downloadAllQRCodesPDF(properties as any[], baseUrl);
    toast({
      title: 'Descarga exitosa',
      description: 'Todos los códigos QR han sido descargados en un PDF.',
    });
    setDownloadingAll(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <AdminNav />

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <Logo size="md" showText />
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold">Códigos QR</h1>
            <p className="text-muted-foreground">Genera y descarga códigos QR para cada propiedad</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link to="/admin/generar-qr">
              <Button variant="default">
                <Navigation className="w-4 h-4" />
                Generar QR de Ruta
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={handleDownloadAll}
              disabled={downloadingAll || properties.length === 0}
            >
              {downloadingAll ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Descargar Todos (PDF)
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Generando códigos QR...</p>
          </div>
        )}

        {/* QR Codes Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property, index) => (
              <div 
                key={property.id}
                className="glass-card p-6 text-center animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* QR Code Preview */}
                <div className="bg-white rounded-xl p-4 mb-4 inline-block">
                  {qrCodes[property.id] ? (
                    <img 
                      src={qrCodes[property.id]} 
                      alt={`QR Code para ${property.name}`}
                      className="w-48 h-48 mx-auto"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-secondary rounded-lg animate-pulse" />
                  )}
                </div>

                {/* Property Info */}
                <h3 className="font-semibold text-lg mb-1">{property.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 font-mono">
                  /property/{property.slug}
                </p>

                {/* Download Buttons */}
                <div className="flex gap-2 justify-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadPNG(property)}
                  >
                    <Image className="w-4 h-4" />
                    PNG
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadPDF(property)}
                  >
                    <FileText className="w-4 h-4" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && properties.length === 0 && (
          <div className="text-center py-12 glass-card">
            <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay propiedades activas para generar QR.</p>
            <Link to="/admin/propiedades">
              <Button className="mt-4">
                <MapPin className="w-4 h-4" />
                Ir a Propiedades
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminQRCodes;