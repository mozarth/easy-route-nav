import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation, ArrowRight, QrCode, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Features } from '@/components/Features';
import { PropertyCard } from '@/components/PropertyCard';
import { getProperties, Property } from '@/lib/storage';

const Index = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProperties = async () => {
      const props = await getProperties();
      setProperties(props.filter(p => p.isActive));
      setLoading(false);
    };
    loadProperties();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>
        
        <div className="container max-w-6xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6 animate-fade-in">
              <QrCode className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Sistema de Navegación QR</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
              Llega a tu destino con un{' '}
              <span className="text-gradient-primary">simple escaneo</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
              Escanea el código QR de la propiedad y obtén direcciones instantáneas 
              en tu navegador móvil. Sin descargas, sin complicaciones.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Link to="/admin">
                <Button variant="navigation" size="xl">
                  <Navigation className="w-5 h-5" />
                  Panel de Administración
                </Button>
              </Link>
              <a href="#properties">
                <Button variant="outline" size="xl">
                  Ver Propiedades
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <Features />

      {/* Properties Section */}
      <section id="properties" className="py-20 px-4 bg-secondary/30">
        <div className="container max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Propiedades <span className="text-gradient-primary">Disponibles</span>
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Selecciona una propiedad para ver su ubicación y obtener direcciones
          </p>
          
          {loading && (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando propiedades...</p>
            </div>
          )}
          
          {!loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property, index) => (
                <div
                  key={property.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          )}
          
          {!loading && properties.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay propiedades activas disponibles.</p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border/50">
        <div className="container max-w-6xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Sistema de Navegación QR. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;