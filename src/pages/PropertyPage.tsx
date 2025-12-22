import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, AlertCircle, ArrowLeft, Loader2, Navigation, Home, ChevronDown } from 'lucide-react';
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

  const handleLoteSelect = (loteId: string) => {
    const lote = lotes.find(l => l.id === loteId);
    if (lote) {
      setNumeroLote(lote.numero);
      setLoteEncontrado(lote);
      setError('');
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

      <div className="flex flex-col items-center justify-center min-h-screen p-6 pt-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {property.name}
            </h1>
            {property.etapa && (
              <p className="text-lg text-primary font-semibold">
                {property.etapa}
              </p>
            )}
            {property.address && (
              <p className="text-muted-foreground text-sm mt-1">
                {property.address}
              </p>
            )}
          </div>

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
                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    Seleccione su lote/casa
                  </h2>
                  
                  <div className="space-y-4">
                    <Select onValueChange={handleLoteSelect}>
                      <SelectTrigger className="w-full h-14 text-lg">
                        <SelectValue placeholder="Seleccione un lote/casa..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card border border-border max-h-60">
                        {lotes
                          .sort((a, b) => {
                            // Sort numerically if possible, otherwise alphabetically
                            const numA = parseInt(a.numero);
                            const numB = parseInt(b.numero);
                            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
                            return a.numero.localeCompare(b.numero);
                          })
                          .map((lote) => (
                            <SelectItem 
                              key={lote.id} 
                              value={lote.id}
                              className="text-base py-3"
                            >
                              {lote.tipo === 'casa' ? '🏠 Casa' : '📍 Lote'} {lote.numero}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {error && (
                      <p className="text-destructive text-sm text-center">{error}</p>
                    )}
                  </div>

                  {/* Available lotes hint */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-muted-foreground text-xs text-center">
                      {lotes.length} lotes/casas disponibles
                    </p>
                  </div>
                </div>
              ) : (
                /* Lote found */
                <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      ¡Encontrado!
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      {loteEncontrado.tipo === 'casa' ? 'Casa' : 'Lote'} {loteEncontrado.numero}
                    </p>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground text-center">
                      Coordenadas: {loteEncontrado.latitude.toFixed(6)}, {loteEncontrado.longitude.toFixed(6)}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={abrirGoogleMaps}
                      className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                      size="lg"
                    >
                      <Navigation className="w-5 h-5 mr-2" />
                      Ver Ruta en Google Maps
                    </Button>
                    
                    <Button
                      onClick={reiniciarBusqueda}
                      variant="outline"
                      className="w-full"
                    >
                      Buscar otro lote/casa
                    </Button>
                  </div>
                </div>
              )}

              {/* Info */}
              <p className="text-center text-muted-foreground text-sm mt-6">
                Al abrir Google Maps, verá la ruta desde la entrada hasta su lote/casa
              </p>
            </>
          ) : (
            // Property has no lotes - show direct navigation
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              {property.description && (
                <p className="text-foreground mb-4">{property.description}</p>
              )}

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground text-center">
                  Coordenadas: {property.latitude.toFixed(6)}, {property.longitude.toFixed(6)}
                </p>
              </div>

              <Button
                onClick={openGoogleMapsToProperty}
                className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <Navigation className="w-5 h-5 mr-2" />
                Abrir en Google Maps
              </Button>

              <p className="text-center text-muted-foreground text-sm mt-4">
                Se abrirá Google Maps con la ruta hacia {property.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyPage;
