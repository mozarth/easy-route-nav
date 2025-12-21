import colinasMap from '@/assets/colinas-map.jpg';

interface PropertyMapProps {
  propertySlug: string;
}

const PropertyMap = ({ propertySlug }: PropertyMapProps) => {
  if (propertySlug !== 'colinas') {
    return null;
  }

  return (
    <div className="glass-card p-4 mb-6 overflow-hidden">
      <h2 className="font-semibold mb-3 text-lg">Mapa del Condominio</h2>
      <div className="relative rounded-lg overflow-hidden">
        <img 
          src={colinasMap} 
          alt="Mapa de Colinas de Juanito Laguna" 
          className="w-full h-auto rounded-lg"
        />
        {/* You are here marker - positioned at the entrance (bottom left area) */}
        <div className="absolute bottom-[28%] left-[18%] transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative">
            {/* Pulsing ring */}
            <div className="absolute inset-0 w-8 h-8 bg-primary/30 rounded-full animate-ping" />
            {/* Main marker */}
            <div className="relative w-8 h-8 bg-primary rounded-full border-4 border-primary-foreground shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-primary-foreground rounded-full" />
            </div>
            {/* Label */}
            <div className="absolute left-10 top-1/2 -translate-y-1/2 whitespace-nowrap">
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg">
                📍 Usted está aquí
              </span>
            </div>
          </div>
        </div>
      </div>
      <p className="text-muted-foreground text-sm mt-3 text-center">
        Coordenadas: 6°5'39.102"N 75°29'49.608"W
      </p>
    </div>
  );
};

export default PropertyMap;
