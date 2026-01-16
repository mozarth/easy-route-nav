import { Link } from 'react-router-dom';
import { Navigation, QrCode, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { Features } from '@/components/Features';

const Index = () => {
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
              <Link to="/admin">
                <Button variant="outline" size="xl">
                  <UserCircle className="w-5 h-5" />
                  Ingreso Usuarios
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <Features />

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