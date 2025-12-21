import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, AlertCircle, ArrowLeft, ExternalLink, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import PropertyMap from '@/components/PropertyMap';
import { getPropertyBySlug, logAccess } from '@/lib/storage';
import { Property } from '@/types/property';

const PropertyPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingLocation, setRequestingLocation] = useState(false);

  useEffect(() => {
    if (slug) {
      const found = getPropertyBySlug(slug);
      setProperty(found || null);
      
      if (found) {
        logAccess(found.id, found.name);
      }
      
      setLoading(false);
    }
  }, [slug]);

  const requestLocation = () => {
    setRequestingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Tu navegador no soporta geolocalización');
      setRequestingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setRequestingLocation(false);
      },
      (error) => {
        let message = 'No se pudo obtener tu ubicación';
        if (error.code === error.PERMISSION_DENIED) {
          message = 'Por favor, permite el acceso a tu ubicación para obtener direcciones';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = 'La información de ubicación no está disponible';
        } else if (error.code === error.TIMEOUT) {
          message = 'Se agotó el tiempo para obtener la ubicación';
        }
        setLocationError(message);
        setRequestingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const openGoogleMaps = () => {
    if (!property) return;
    
    const destination = `${property.latitude},${property.longitude}`;
    let url: string;
    
    if (userLocation) {
      const origin = `${userLocation.lat},${userLocation.lng}`;
      url = `https://www.google.com/maps/dir/${origin}/${destination}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }
    
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

  return (
    <div className="min-h-screen bg-background">
      {/* Logo fixed top-left */}
      <div className="fixed top-4 left-4 z-50">
        <Logo size="md" showText />
      </div>

      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 sticky top-0 z-10 pt-16">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center glow-primary">
              <MapPin className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{property.name}</h1>
              {property.address && (
                <p className="text-muted-foreground text-sm">{property.address}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-2xl mx-auto px-4 py-8">
        {/* Custom Map for Colinas */}
        <PropertyMap propertySlug={property.slug} />

        {/* Description */}
        {property.description && (
          <div className="glass-card p-6 mb-6">
            <p className="text-foreground">{property.description}</p>
          </div>
        )}

        {/* Coordinates */}
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Coordenadas GPS
          </h2>
          <div className="font-mono text-sm bg-secondary rounded-lg p-3">
            <p>Latitud: {property.latitude}</p>
            <p>Longitud: {property.longitude}</p>
          </div>
        </div>

        {/* Location Request */}
        {!userLocation && (
          <div className="glass-card p-6 mb-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              Tu Ubicación
            </h2>
            
            {locationError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-4">
                <p className="text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {locationError}
                </p>
              </div>
            )}
            
            <p className="text-muted-foreground text-sm mb-4">
              Permite el acceso a tu ubicación para calcular la ruta más óptima hacia la propiedad.
            </p>
            
            <Button 
              onClick={requestLocation} 
              disabled={requestingLocation}
              variant="navigation"
              className="w-full"
            >
              {requestingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Obteniendo ubicación...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Permitir Ubicación
                </>
              )}
            </Button>
          </div>
        )}

        {/* User Location Found */}
        {userLocation && (
          <div className="glass-card p-6 mb-6 border-success/30">
            <h2 className="font-semibold mb-3 flex items-center gap-2 text-success">
              <Navigation className="w-5 h-5" />
              Ubicación Detectada
            </h2>
            <div className="font-mono text-sm bg-secondary rounded-lg p-3">
              <p>Tu ubicación: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}</p>
            </div>
          </div>
        )}

        {/* Open Google Maps Button */}
        <Button 
          onClick={openGoogleMaps}
          variant="accent"
          size="xl"
          className="w-full"
        >
          <ExternalLink className="w-5 h-5" />
          Abrir en Google Maps
        </Button>

        <p className="text-center text-muted-foreground text-xs mt-4">
          Se abrirá Google Maps con la ruta hacia {property.name}
        </p>
      </main>
    </div>
  );
};

export default PropertyPage;
