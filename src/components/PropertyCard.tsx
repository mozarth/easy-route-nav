import { Link } from 'react-router-dom';
import { MapPin, ArrowRight } from 'lucide-react';
import { Property } from '@/types/property';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  return (
    <Link
      to={`/property/${property.slug}`}
      className="glass-card p-6 group hover:scale-[1.02] transition-all duration-300 block"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center group-hover:glow-primary transition-shadow">
          <MapPin className="w-6 h-6 text-primary-foreground" />
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
      
      <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">
        {property.name}
      </h3>
      
      {property.description && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {property.description}
        </p>
      )}
      
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono bg-secondary px-2 py-1 rounded">
          {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
        </span>
      </div>
    </Link>
  );
};
