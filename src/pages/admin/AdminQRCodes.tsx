import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Navigation, 
  MapPin, 
  Clock,
  Download,
  FileText,
  Image,
  BarChart3,
  QrCode,
  Home,
  LogOut,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { getProperties } from '@/lib/storage';
import { Property } from '@/types/property';
import { generateQRCodeDataURL, downloadQRCodePNG, downloadQRCodePDF, downloadAllQRCodesPDF } from '@/lib/qr-generator';
import { useToast } from '@/hooks/use-toast';

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
    const props = getProperties().filter(p => p.isActive);
    setProperties(props);

    const codes: { [key: string]: string } = {};
    for (const prop of props) {
      const url = `${baseUrl}/property/${prop.slug}`;
      codes[prop.id] = await generateQRCodeDataURL(url);
    }
    setQrCodes(codes);
    setLoading(false);
  };

  const handleDownloadPNG = async (property: Property) => {
    await downloadQRCodePNG(property, baseUrl);
    toast({
      title: 'Descarga exitosa',
      description: `QR de ${property.name} descargado como PNG.`,
    });
  };

  const handleDownloadPDF = async (property: Property) => {
    await downloadQRCodePDF(property, baseUrl);
    toast({
      title: 'Descarga exitosa',
      description: `QR de ${property.name} descargado como PDF.`,
    });
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    await downloadAllQRCodesPDF(properties, baseUrl);
    toast({
      title: 'Descarga exitosa',
      description: 'Todos los códigos QR han sido descargados en un PDF.',
    });
    setDownloadingAll(false);
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border p-4 hidden lg:block">
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Navigation className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold">QR Admin</span>
        </div>

        <nav className="space-y-1">
          <Link 
            to="/admin/dashboard" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <BarChart3 className="w-5 h-5" />
            Dashboard
          </Link>
          <Link 
            to="/admin/properties" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <MapPin className="w-5 h-5" />
            Propiedades
          </Link>
          <Link 
            to="/admin/history" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Clock className="w-5 h-5" />
            Historial
          </Link>
          <Link 
            to="/admin/qr-codes" 
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary"
          >
            <QrCode className="w-5 h-5" />
            Códigos QR
          </Link>
        </nav>

        <div className="absolute bottom-4 left-4 right-4 space-y-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Home className="w-4 h-4" />
              Ver Sitio Público
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground" onClick={logout}>
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-4 lg:p-8">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Navigation className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-semibold">QR Admin</span>
          </div>
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
          <Button 
            variant="navigation" 
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
            <Link to="/admin/properties">
              <Button className="mt-4">
                <MapPin className="w-4 h-4" />
                Ir a Propiedades
              </Button>
            </Link>
          </div>
        )}

        {/* Mobile Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 flex justify-around">
          <Link to="/admin/dashboard" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <BarChart3 className="w-5 h-5" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link to="/admin/properties" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <MapPin className="w-5 h-5" />
            <span className="text-xs">Propiedades</span>
          </Link>
          <Link to="/admin/history" className="flex flex-col items-center gap-1 p-2 text-muted-foreground">
            <Clock className="w-5 h-5" />
            <span className="text-xs">Historial</span>
          </Link>
          <Link to="/admin/qr-codes" className="flex flex-col items-center gap-1 p-2 text-primary">
            <QrCode className="w-5 h-5" />
            <span className="text-xs">QR</span>
          </Link>
        </nav>
      </main>
    </div>
  );
};

export default AdminQRCodes;
