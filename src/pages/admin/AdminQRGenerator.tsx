import { useEffect, useState } from 'react';
import { 
  QrCode, 
  Download, 
  Loader2,
  LogOut,
  Navigation,
  Home,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getProperties, Property, getLotesByPropertyId, PropertyLote } from '@/lib/storage';
import { generateQRCodeDataURL } from '@/lib/qr-generator';
import { useToast } from '@/hooks/use-toast';
import { AdminNav } from '@/components/admin/AdminNav';
import jsPDF from 'jspdf';

const AdminQRGenerator = () => {
  const { logout } = useAuth();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [lotes, setLotes] = useState<PropertyLote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLotes, setLoadingLotes] = useState(false);
  
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    setLoading(true);
    const props = await getProperties();
    setProperties(props.filter(p => p.isActive));
    setLoading(false);
  };

  const handlePropertySelect = async (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedLoteId('');
    setQrCodeUrl(null);
    setLotes([]);

    if (propertyId) {
      setLoadingLotes(true);
      const propertyLotes = await getLotesByPropertyId(propertyId);
      setLotes(propertyLotes);
      setLoadingLotes(false);
    }
  };

  const handleLoteSelect = async (loteId: string) => {
    setSelectedLoteId(loteId);
    setQrCodeUrl(null);

    if (!loteId) return;

    const property = properties.find(p => p.id === selectedPropertyId);
    const lote = lotes.find(l => l.id === loteId);
    
    if (!property || !lote) return;

    setGeneratingQR(true);
    
    // Use custom route URL if available, otherwise generate from coordinates
    let googleMapsUrl: string;
    if (lote.customRouteUrl) {
      googleMapsUrl = lote.customRouteUrl;
    } else {
      const origen = `${property.latitude},${property.longitude}`;
      const destino = `${lote.latitude},${lote.longitude}`;
      googleMapsUrl = `https://www.google.com/maps/dir/${origen}/${destino}`;
    }
    
    const qrDataUrl = await generateQRCodeDataURL(googleMapsUrl);
    setQrCodeUrl(qrDataUrl);
    setGeneratingQR(false);
  };

  const openGoogleMaps = () => {
    const property = properties.find(p => p.id === selectedPropertyId);
    const lote = lotes.find(l => l.id === selectedLoteId);
    
    if (!property || !lote) return;

    // Use custom route URL if available
    if (lote.customRouteUrl) {
      window.open(lote.customRouteUrl, '_blank');
    } else {
      const origen = `${property.latitude},${property.longitude}`;
      const destino = `${lote.latitude},${lote.longitude}`;
      const url = `https://www.google.com/maps/dir/${origen}/${destino}`;
      window.open(url, '_blank');
    }
  };

  const openWaze = () => {
    const lote = lotes.find(l => l.id === selectedLoteId);
    if (!lote || !lote.latitude || !lote.longitude) return;
    // Waze doesn't support waypoints — always navigate directly to the final coords.
    const url = `https://www.waze.com/ul?ll=${lote.latitude}%2C${lote.longitude}&navigate=yes&zoom=17`;
    window.open(url, '_blank');
  };

  const downloadQRPNG = () => {
    if (!qrCodeUrl) return;
    const lote = lotes.find(l => l.id === selectedLoteId);
    const property = properties.find(p => p.id === selectedPropertyId);
    
    const link = document.createElement('a');
    link.download = `QR-${property?.name}-${lote?.tipo}-${lote?.numero}.png`;
    link.href = qrCodeUrl;
    link.click();

    toast({
      title: 'Descargado',
      description: 'Código QR descargado como PNG',
    });
  };

  const downloadQRPDF = async () => {
    if (!qrCodeUrl) return;
    const lote = lotes.find(l => l.id === selectedLoteId);
    const property = properties.find(p => p.id === selectedPropertyId);
    
    if (!lote || !property) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(property.name, pageWidth / 2, 30, { align: 'center' });
    
    pdf.setFontSize(18);
    pdf.text(`${lote.tipo === 'casa' ? 'Casa' : 'Lote'} ${lote.numero}`, pageWidth / 2, 42, { align: 'center' });

    const qrSize = 100;
    const qrX = (pageWidth - qrSize) / 2;
    pdf.addImage(qrCodeUrl, 'PNG', qrX, 55, qrSize, qrSize);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Escanea el código QR para obtener', pageWidth / 2, 170, { align: 'center' });
    pdf.text('la ruta en Google Maps', pageWidth / 2, 180, { align: 'center' });

    pdf.save(`QR-${property.name}-${lote.tipo}-${lote.numero}.pdf`);

    toast({
      title: 'Descargado',
      description: 'Código QR descargado como PDF',
    });
  };

  const resetSelection = () => {
    setSelectedPropertyId('');
    setSelectedLoteId('');
    setQrCodeUrl(null);
    setLotes([]);
  };

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const selectedLote = lotes.find(l => l.id === selectedLoteId);

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Generar QR de Ruta</h1>
          <p className="text-muted-foreground">Selecciona una propiedad y un lote para generar el código QR con la ruta</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando propiedades...</p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            <div className="glass-card p-6 space-y-6">
              {/* Step 1: Select Property */}
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">1</span>
                  Selecciona la propiedad
                </label>
                <Select value={selectedPropertyId} onValueChange={handlePropertySelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar propiedad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                        {property.etapa && ` - ${property.etapa}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Step 2: Select Lote */}
              {selectedPropertyId && (
                <div className="animate-fade-in">
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">2</span>
                    Selecciona el lote/casa
                  </label>
                  {loadingLotes ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cargando lotes...
                    </div>
                  ) : lotes.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-2">
                      Esta propiedad no tiene lotes registrados.
                    </p>
                  ) : (
                    <Select value={selectedLoteId} onValueChange={handleLoteSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar lote/casa..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {lotes
                          .sort((a, b) => {
                            const numA = parseInt(a.numero);
                            const numB = parseInt(b.numero);
                            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                            return a.numero.localeCompare(b.numero);
                          })
                          .map((lote) => (
                            <SelectItem key={lote.id} value={lote.id}>
                              {lote.tipo === 'casa' ? '🏠 Casa' : '📍 Lote'} {lote.numero}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              {/* Step 3: QR Code Result */}
              {selectedLoteId && (
                <div className="animate-fade-in">
                  <label className="text-sm font-medium mb-3 block flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">3</span>
                    Código QR generado
                  </label>

                  {generatingQR ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                  ) : qrCodeUrl ? (
                    <div className="text-center space-y-4">
                      <div className="bg-white rounded-xl p-4 inline-block mx-auto">
                        <img 
                          src={qrCodeUrl} 
                          alt="Código QR de ruta"
                          className="w-48 h-48"
                        />
                      </div>

                      <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{selectedProperty?.name}</p>
                        <p>{selectedLote?.tipo === 'casa' ? 'Casa' : 'Lote'} {selectedLote?.numero}</p>
                      </div>

                      <div className="space-y-2">
                        <Button
                          onClick={openGoogleMaps}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Ver Ruta en Google Maps
                        </Button>

                        <Button
                          onClick={openWaze}
                          className="w-full bg-[#33CCFF] hover:bg-[#29B8E8] text-black"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Ver Ruta en Waze
                        </Button>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={downloadQRPNG}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PNG
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={downloadQRPDF}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            PDF
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          className="w-full text-muted-foreground"
                          onClick={resetSelection}
                        >
                          Generar otro QR
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {properties.length === 0 && (
                <div className="text-center py-8">
                  <QrCode className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No hay propiedades activas.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminQRGenerator;
