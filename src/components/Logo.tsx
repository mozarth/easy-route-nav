import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  linkToHome?: boolean;
}

export const Logo = ({ size = 'md', showText = true, linkToHome = true }: LogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const content = (
    <div className="flex items-center gap-3">
      <div className={`${sizeClasses[size]} rounded-xl gradient-primary flex items-center justify-center glow-primary`}>
        <Send className={`${iconSizes[size]} text-primary-foreground`} />
      </div>
      {showText && (
        <span className={`font-semibold ${textSizes[size]}`}>QR Navegación</span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};
