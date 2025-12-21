import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Logo size="md" showText />
        
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
