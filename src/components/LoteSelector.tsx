import { useState } from 'react';
import { MapPin, Home, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lote, getEtapas, getLotesByEtapa, formatCoordinates, COLINAS_ENTRADA } from '@/types/lote';

interface LoteSelectorProps {
  onLoteSelected: (lote: Lote | null) => void;
}

const LoteSelector = ({ onLoteSelected }: LoteSelectorProps) => {
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<number | null>(null);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  
  const etapas = getEtapas();
  const lotesDisponibles = etapaSeleccionada ? getLotesByEtapa(etapaSeleccionada) : [];

  const handleEtapaChange = (value: string) => {
    const etapa = parseInt(value);
    setEtapaSeleccionada(etapa);
    setLoteSeleccionado(null);
    onLoteSelected(null);
  };

  const handleLoteChange = (value: string) => {
    const lote = lotesDisponibles.find(l => l.id === value);
    setLoteSeleccionado(lote || null);
    onLoteSelected(lote || null);
  };

  const openGoogleMapsRoute = () => {
    if (!loteSeleccionado) return;
    
    const origin = `${COLINAS_ENTRADA.latitude},${COLINAS_ENTRADA.longitude}`;
    const destination = `${loteSeleccionado.latitude},${loteSeleccionado.longitude}`;
    const url = `https://www.google.com/maps/dir/${origin}/${destination}`;
    
    window.open(url, '_blank');
  };

  return (
    <div className="glass-card p-6 mb-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg">
        <Home className="w-5 h-5 text-primary" />
        Buscar Lote o Casa
      </h2>
      
      <div className="space-y-4">
        {/* Selector de Etapa */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Selecciona la Etapa
          </label>
          <Select onValueChange={handleEtapaChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige una etapa..." />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3].map((etapa) => (
                <SelectItem key={etapa} value={etapa.toString()}>
                  Etapa {etapa}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de Lote/Casa */}
        {etapaSeleccionada && (
          <div className="animate-fade-in">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Selecciona el Lote o Casa
            </label>
            {lotesDisponibles.length > 0 ? (
              <Select onValueChange={handleLoteChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Elige un lote o casa..." />
                </SelectTrigger>
                <SelectContent>
                  {lotesDisponibles.map((lote) => (
                    <SelectItem key={lote.id} value={lote.id}>
                      {lote.tipo === 'casa' ? 'Casa' : 'Lote'} #{lote.numero}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                No hay lotes registrados en esta etapa aún
              </p>
            )}
          </div>
        )}

        {/* Información del Lote Seleccionado */}
        {loteSeleccionado && (
          <div className="animate-fade-in bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h3 className="font-semibold text-primary flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4" />
              {loteSeleccionado.tipo === 'casa' ? 'Casa' : 'Lote'} #{loteSeleccionado.numero} - Etapa {loteSeleccionado.etapa}
            </h3>
            
            <div className="font-mono text-xs bg-secondary rounded-lg p-3 mb-4">
              <p className="text-muted-foreground mb-1">Coordenadas GPS:</p>
              <p className="text-foreground">{formatCoordinates(loteSeleccionado.latitude, loteSeleccionado.longitude)}</p>
              <p className="text-muted-foreground text-xs mt-1">
                ({loteSeleccionado.latitude.toFixed(6)}, {loteSeleccionado.longitude.toFixed(6)})
              </p>
            </div>

            <Button 
              onClick={openGoogleMapsRoute}
              variant="accent"
              className="w-full"
            >
              <Navigation className="w-4 h-4" />
              Ver Ruta al Lote
              <ExternalLink className="w-4 h-4" />
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-2">
              Se abrirá Google Maps desde la entrada del condominio
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoteSelector;
