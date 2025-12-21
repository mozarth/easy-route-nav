import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { MapPin, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Logo fixed top-left */}
      <div className="fixed top-4 left-4 z-50">
        <Logo size="md" showText />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="text-center relative max-w-md">
        <div className="w-24 h-24 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 glow-primary">
          <MapPin className="w-12 h-12 text-primary-foreground" />
        </div>
        
        <h1 className="text-6xl font-bold text-gradient-primary mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Página no encontrada</h2>
        <p className="text-muted-foreground mb-8">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="navigation" size="lg">
              <Home className="w-5 h-5" />
              Ir al Inicio
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
