import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, AlertCircle, ArrowLeft, Loader2, Navigation, Home, QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { getPropertyBySlug, logAccess, Property, getLotesByPropertyId, PropertyLote } from '@/lib/storage';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateQRCodeDataURL } from '@/lib/qr-generator';

const PropertyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [lotes, setLotes] = useState<PropertyLote[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingLotes, setLoadingLotes] = useState(false);
  
  // Lote search state
  const [numeroLote, setNumeroLote] = useState('');
  const [error, setError] = useState('');
  const [loteEncontrado, setLoteEncontrado] = useState<PropertyLote | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    const loadProperty = async () => {
      if (slug) {
        const found = await getPropertyBySlug(slug);
        setProperty(found);
        
        if (found) {
          await logAccess(found.id, found.name);
          
          // Load lotes for this property
          setLoadingLotes(true);
          const propertyLotes = await getLotesByPropertyId(found.id);
          setLotes(propertyLotes);
          setLoadingLotes(false);
        }
        
        setLoading(false);
      }
    };
    loadProperty();
  }, [slug]);

  const handleLoteSelect = async (loteId: string) => {
    const lote = lotes.find(l => l.id === loteId);
    if (lote && property) {
      setNumeroLote(lote.numero);
      setLoteEncontrado(lote);
      setError('');
      setQrCodeUrl(null);
      
      // Generate QR code with Google Maps route
      setGeneratingQR(true);
      const origen = `${property.latitude},${property.longitude}`;
      const destino = `${lote.latitude},${lote.longitude}`;
      const googleMapsUrl = `https://www.google.com/maps/dir/${origen}/${destino}`;
      const qrDataUrl = await generateQRCodeDataURL(googleMapsUrl);
      setQrCodeUrl(qrDataUrl);
      setGeneratingQR(false);
    }
  };

  const abrirGoogleMaps = () => {
    if (loteEncontrado && property) {
      // Use property coordinates as entrance/origin
      const origen = `${property.latitude},${property.longitude}`;
      const destino = `${loteEncontrado.latitude},${loteEncontrado.longitude}`;
      const url = `https://www.google.com/maps/dir/${origen}/${destino}`;
      window.open(url, '_blank');
    }
  };

  const reiniciarBusqueda = () => {
    setNumeroLote('');
    setLoteEncontrado(null);
    setError('');
    setQrCodeUrl(null);
  };

  const downloadQR = () => {
    if (qrCodeUrl && loteEncontrado) {
      const link = document.createElement('a');
      link.download = `ruta-${loteEncontrado.tipo}-${loteEncontrado.numero}.png`;
      link.href = qrCodeUrl;
      link.click();
    }
  };

  // Open Google Maps directly to property (for properties without lotes)
  const openGoogleMapsToProperty = () => {
    if (!property) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${property.latitude},${property.longitude}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando propiedad...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="glass-card p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Propiedad no encontrada</h1>
          <p className="text-muted-foreground mb-6">
            La propiedad que buscas no existe o ha sido desactivada.
          </p>
          <Link to="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // If property has lotes, show the lote finder interface
  const hasLotes = lotes.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Logo fixed top-left */}
      <div className="fixed top-4 left-4 z-50">
        <Logo size="md" showText />
      </div>

      <div className="flex flex-col items-center justify-start min-h-screen p-4 pt-20 pb-8">
        <div className="w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold text-foreground">
              {property.name}
            </h1>
            {property.etapa && (
              <p className="text-sm text-primary font-semibold">
                {property.etapa}
              </p>
            )}
          </div>

          {/* Map Image */}
          {property.mapImageUrl && (
            <div className="mb-4 rounded-xl overflow-hidden border border-border shadow-lg">
              <img 
                src={property.mapImageUrl} 
                alt={`Mapa de ${property.name}`}
                className="w-full h-auto"
              />
            </div>
          )}

          {loadingLotes ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Cargando lotes...</p>
            </div>
          ) : hasLotes ? (
            // Property has lotes - show lote finder
            <>
              {!loteEncontrado ? (
                /* Dropdown selector */
                <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
                  <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary" />
                    Seleccione su lote/casa
                  </h2>
                  
                  <Select onValueChange={handleLoteSelect}>
                    <SelectTrigger className="w-full h-12 text-base">
                      <SelectValue placeholder="Seleccione un lote/casa..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-border max-h-60">
                      {lotes
                        .sort((a, b) => {
                          const numA = parseInt(a.numero);
                          const numB = parseInt(b.numero);
                          if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                          return a.numero.localeCompare(b.numero);
                        })
                        .map((lote) => (
                          <SelectItem 
                            key={lote.id} 
                            value={lote.id}
                            className="text-base py-2"
                          >
                            {lote.tipo === 'casa' ? '🏠 Casa' : '📍 Lote'} {lote.numero}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <p className="text-muted-foreground text-xs text-center mt-3">
                    {lotes.length} lotes/casas disponibles
                  </p>
                </div>
              ) : (
                /* Lote found with QR */
                <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-foreground">
                      {loteEncontrado.tipo === 'casa' ? 'Casa' : 'Lote'} {loteEncontrado.numero}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Escanea el QR o presiona el botón para ver la ruta
                    </p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center mb-4">
                    {generatingQR ? (
                      <div className="w-48 h-48 bg-muted rounded-xl flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                    ) : qrCodeUrl ? (
                      <div className="bg-white p-3 rounded-xl shadow-md">
                        <img 
                          src={qrCodeUrl} 
                          alt="QR Code para ruta" 
                          className="w-48 h-48"
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={abrirGoogleMaps}
                      className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <Navigation className="w-5 h-5 mr-2" />
                      Ver Ruta en Google Maps
                    </Button>

                    {qrCodeUrl && (
                      <Button
                        onClick={downloadQR}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descargar QR
                      </Button>
                    )}
                    
                    <Button
                      onClick={reiniciarBusqueda}
                      variant="ghost"
                      className="w-full text-muted-foreground"
                    >
                      Buscar otro lote/casa
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Property has no lotes - show direct navigation
            <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
              {property.description && (
                <p className="text-foreground mb-4 text-sm">{property.description}</p>
              )}

              <Button
                onClick={openGoogleMapsToProperty}
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Navigation className="w-5 h-5 mr-2" />
                Abrir en Google Maps
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPage;
