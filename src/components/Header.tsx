import { Link } from 'react-router-dom';
import { Navigation, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center group-hover:glow-primary transition-shadow">
            <Navigation className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-lg hidden sm:block">
            QR <span className="text-primary">Navegación</span>
          </span>
        </Link>
        
        <Link to="/admin">
          <Button variant="glass" size="sm">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Panel Admin</span>
          </Button>
        </Link>
      </div>
    </header>
  );
};
