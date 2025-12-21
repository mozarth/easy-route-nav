import { useState } from 'react';
import colinasMap from '@/assets/colinas-map.jpg';
import LoteSelector from './LoteSelector';
import { Lote, COLINAS_ENTRADA, formatCoordinates } from '@/types/lote';

interface PropertyMapProps {
  propertySlug: string;
}

const PropertyMap = ({ propertySlug }: PropertyMapProps) => {
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);

  if (propertySlug !== 'colinas') {
    return null;
  }

  // Calculate marker position based on selected lote (for visual representation)
  const getMarkerPosition = () => {
    if (loteSeleccionado) {
      // Position the marker based on the lote's relative position
      // Lote 1 Etapa 1 is at the top-right area of the map
      return { bottom: '65%', left: '75%' };
    }
    // Default: entrance position
    return { bottom: '28%', left: '18%' };
  };

  const markerPos = getMarkerPosition();

  return (
    <div className="space-y-4 mb-6">
      {/* Lote Selector */}
      <LoteSelector onLoteSelected={setLoteSeleccionado} />

      {/* Map */}
      <div className="glass-card p-4 overflow-hidden">
        <h2 className="font-semibold mb-3 text-lg">Mapa del Condominio</h2>
        <div className="relative rounded-lg overflow-hidden">
          <img 
            src={colinasMap} 
            alt="Mapa de Colinas de Juanito Laguna" 
            className="w-full h-auto rounded-lg"
          />
          
          {/* Entrance marker - always visible */}
          <div className="absolute bottom-[28%] left-[18%] transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="relative">
              <div className="absolute inset-0 w-6 h-6 bg-success/30 rounded-full animate-ping" />
              <div className="relative w-6 h-6 bg-success rounded-full border-3 border-primary-foreground shadow-lg flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-primary-foreground rounded-full" />
              </div>
              <div className="absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap">
                <span className="bg-success text-success-foreground text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg">
                  🚪 Entrada
                </span>
              </div>
            </div>
          </div>

          {/* Selected Lote marker */}
          {loteSeleccionado && (
            <div 
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 animate-fade-in"
              style={{ bottom: markerPos.bottom, left: markerPos.left }}
            >
              <div className="relative">
                <div className="absolute inset-0 w-8 h-8 bg-primary/30 rounded-full animate-ping" />
                <div className="relative w-8 h-8 bg-primary rounded-full border-4 border-primary-foreground shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                </div>
                <div className="absolute left-10 top-1/2 -translate-y-1/2 whitespace-nowrap">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded shadow-lg">
                    📍 Lote #{loteSeleccionado.numero}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Route line (visual representation) */}
          {loteSeleccionado && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-5">
              <line 
                x1="18%" y1="72%" 
                x2="75%" y2="35%" 
                stroke="hsl(var(--primary))" 
                strokeWidth="3" 
                strokeDasharray="8,4"
                className="animate-pulse"
              />
            </svg>
          )}
        </div>
        
        <div className="mt-3 text-center">
          {loteSeleccionado ? (
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Destino:</strong> {formatCoordinates(loteSeleccionado.latitude, loteSeleccionado.longitude)}
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Entrada:</strong> {formatCoordinates(COLINAS_ENTRADA.latitude, COLINAS_ENTRADA.longitude)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyMap;
