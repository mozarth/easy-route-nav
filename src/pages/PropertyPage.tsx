import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, AlertCircle, ArrowLeft, Loader2, Navigation, Home, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    const lote = lotes.find((l) => l.id === loteId);
    if (lote && property) {
      setNumeroLote(lote.numero);
      setLoteEncontrado(lote);
      setError('');
      setQrCodeUrl(null);

      // Generate QR code - use custom route URL if available, otherwise generate from coordinates
      setGeneratingQR(true);
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
    }
  };

  const buscarLotePorNumero = async () => {
    const value = numeroLote.trim();
    setError('');

    if (!value) {
      setError('Por favor ingrese el número de lote/casa');
      return;
    }

    if (value.length > 30) {
      setError('Número de lote demasiado largo');
      return;
    }

    const lote = lotes.find(
      (l) => l.numero.trim().toLowerCase() === value.toLowerCase()
    );

    if (!lote) {
      setError(`No se encontró el lote/casa ${value}`);
      return;
    }

    await handleLoteSelect(lote.id);
  };

const abrirGoogleMaps = () => {
    if (loteEncontrado && property) {
      // Use custom route URL if available
      if (loteEncontrado.customRouteUrl) {
        window.open(loteEncontrado.customRouteUrl, '_blank');
      } else {
        const origen = `${property.latitude},${property.longitude}`;
        const destino = `${loteEncontrado.latitude},${loteEncontrado.longitude}`;
        const url = `https://www.google.com/maps/dir/${origen}/${destino}`;
        window.open(url, '_blank');
      }
    }
  };

  const abrirWaze = () => {
    if (loteEncontrado && loteEncontrado.latitude && loteEncontrado.longitude) {
      // Waze doesn't support waypoints — always navigate directly to the lote coords.
      const url = `https://www.waze.com/ul?ll=${loteEncontrado.latitude}%2C${loteEncontrado.longitude}&navigate=yes&zoom=17`;
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

  const openWazeToProperty = () => {
    if (!property) return;
    const url = `https://waze.com/ul?ll=${property.latitude},${property.longitude}&navigate=yes`;
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
            <h1 className="text-xl font-bold text-foreground">{property.name}</h1>
            {property.etapa && (
              <p className="text-sm text-primary font-semibold">{property.etapa}</p>
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
                <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
                  <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                    <Home className="w-4 h-4 text-primary" />
                    Ingrese su número de lote/casa
                  </h2>

                  <div className="space-y-3">
                    <Input
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="Ej: 1, 2, 3..."
                      value={numeroLote}
                      onChange={(e) => {
                        setNumeroLote(e.target.value);
                        if (error) setError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') buscarLotePorNumero();
                      }}
                      className="h-12 text-base"
                      aria-label="Número de lote o casa"
                    />

                    {error && (
                      <p className="text-destructive text-sm text-center">{error}</p>
                    )}

                    <Button onClick={buscarLotePorNumero} className="w-full" size="lg">
                      Buscar
                    </Button>
                  </div>

                  <div className="my-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border" />
                    <p className="text-xs text-muted-foreground">o seleccione en la lista</p>
                    <div className="h-px flex-1 bg-border" />
                  </div>

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

                    <Button
                      onClick={abrirWaze}
                      className="w-full h-12 text-base bg-[#33CCFF] hover:bg-[#29B8E8] text-black"
                      size="lg"
                    >
                      <Navigation className="w-5 h-5 mr-2" />
                      Ver Ruta en Waze
                    </Button>

                    {qrCodeUrl && (
                      <Button onClick={downloadQR} variant="outline" className="w-full">
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

              <div className="space-y-2">
                <Button
                  onClick={openGoogleMapsToProperty}
                  className="w-full h-12 text-base bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Abrir en Google Maps
                </Button>

                <Button
                  onClick={openWazeToProperty}
                  className="w-full h-12 text-base bg-[#33CCFF] hover:bg-[#29B8E8] text-black"
                  size="lg"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Abrir en Waze
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPage;
