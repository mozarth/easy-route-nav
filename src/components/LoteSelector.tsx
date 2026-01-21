import { useState, useEffect } from 'react';
import { MapPin, Home, Navigation, ExternalLink, QrCode, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lote, getEtapas, getLotesByEtapa, formatCoordinates, COLINAS_ENTRADA } from '@/types/lote';
import QRCode from 'qrcode';

interface LoteSelectorProps {
  onLoteSelected: (lote: Lote | null) => void;
  defaultEtapa?: number;
  hideEtapaSelector?: boolean;
}

const LoteSelector = ({ onLoteSelected, defaultEtapa, hideEtapaSelector = false }: LoteSelectorProps) => {
  const [etapaSeleccionada, setEtapaSeleccionada] = useState<number | null>(defaultEtapa || null);
  const [loteSeleccionado, setLoteSeleccionado] = useState<Lote | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);
  
  const etapas = getEtapas();
  const lotesDisponibles = etapaSeleccionada ? getLotesByEtapa(etapaSeleccionada) : [];

  useEffect(() => {
    if (defaultEtapa) {
      setEtapaSeleccionada(defaultEtapa);
    }
  }, [defaultEtapa]);

  const handleEtapaChange = (value: string) => {
    const etapa = parseInt(value);
    setEtapaSeleccionada(etapa);
    setLoteSeleccionado(null);
    setQrCodeUrl(null);
    setShowQR(false);
    onLoteSelected(null);
  };

  const handleLoteChange = (value: string) => {
    const lote = lotesDisponibles.find(l => l.id === value);
    setLoteSeleccionado(lote || null);
    setQrCodeUrl(null);
    setShowQR(false);
    onLoteSelected(lote || null);
  };

  const openGoogleMapsRoute = () => {
    if (!loteSeleccionado) return;
    
    const origin = `${COLINAS_ENTRADA.latitude},${COLINAS_ENTRADA.longitude}`;
    const destination = `${loteSeleccionado.latitude},${loteSeleccionado.longitude}`;
    const url = `https://www.google.com/maps/dir/${origin}/${destination}`;
    
    window.open(url, '_blank');
  };

  const openWazeRoute = () => {
    if (!loteSeleccionado) return;
    const url = `https://waze.com/ul?ll=${loteSeleccionado.latitude},${loteSeleccionado.longitude}&navigate=yes`;
    window.open(url, '_blank');
  };

  const generateQRCode = async () => {
    if (!loteSeleccionado) return;
    
    const origin = `${COLINAS_ENTRADA.latitude},${COLINAS_ENTRADA.longitude}`;
    const destination = `${loteSeleccionado.latitude},${loteSeleccionado.longitude}`;
    const googleMapsUrl = `https://www.google.com/maps/dir/${origin}/${destination}`;
    
    try {
      const qrDataUrl = await QRCode.toDataURL(googleMapsUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      });
      setQrCodeUrl(qrDataUrl);
      setShowQR(true);
    } catch (err) {
      console.error('Error generando QR:', err);
    }
  };

  const downloadQR = () => {
    if (!qrCodeUrl || !loteSeleccionado) return;
    
    const link = document.createElement('a');
    link.download = `QR-Lote-${loteSeleccionado.numero}-Etapa-${loteSeleccionado.etapa}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  return (
    <div className="glass-card p-6 mb-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2 text-lg">
        <Home className="w-5 h-5 text-primary" />
        Buscar Lote o Casa
      </h2>
      
      <div className="space-y-4">
        {/* Selector de Etapa - Solo si no está oculto */}
        {!hideEtapaSelector && (
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Selecciona la Etapa
            </label>
            <Select value={etapaSeleccionada?.toString() || ''} onValueChange={handleEtapaChange}>
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
        )}

        {/* Mostrar etapa fija cuando está oculto el selector */}
        {hideEtapaSelector && etapaSeleccionada && (
          <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
            <p className="text-sm font-medium text-primary">
              Etapa {etapaSeleccionada}
            </p>
          </div>
        )}

        {/* Selector de Lote/Casa */}
        {etapaSeleccionada && (
          <div className={hideEtapaSelector ? '' : 'animate-fade-in'}>
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

            <div className="space-y-3">
              <Button 
                onClick={openGoogleMapsRoute}
                variant="accent"
                className="w-full"
              >
                <Navigation className="w-4 h-4" />
                Ver Ruta en Google Maps
                <ExternalLink className="w-4 h-4" />
              </Button>

              <Button 
                onClick={openWazeRoute}
                className="w-full bg-[#33CCFF] hover:bg-[#29B8E8] text-black"
              >
                <Navigation className="w-4 h-4" />
                Ver Ruta en Waze
                <ExternalLink className="w-4 h-4" />
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                Se abrirá la app de navegación desde la entrada del condominio
              </p>

              {/* Botón para generar QR */}
              <Button 
                onClick={generateQRCode}
                variant="outline"
                className="w-full"
              >
                <QrCode className="w-4 h-4" />
                Generar Código QR del Lote
              </Button>

              {/* QR Code generado */}
              {showQR && qrCodeUrl && (
                <div className="animate-fade-in bg-white rounded-lg p-4 flex flex-col items-center gap-3">
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR Code Lote ${loteSeleccionado.numero}`}
                    className="w-48 h-48"
                  />
                  <p className="text-xs text-gray-600 text-center">
                    Escanea para abrir la ruta en Google Maps
                  </p>
                  <Button
                    onClick={downloadQR}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    <Download className="w-4 h-4" />
                    Descargar QR
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoteSelector;
