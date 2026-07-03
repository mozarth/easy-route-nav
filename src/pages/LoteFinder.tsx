import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/Logo';
import { MapPin, Navigation, Home } from 'lucide-react';
import { COLINAS_LOTES, COLINAS_ENTRADA, Lote } from '@/types/lote';

const LoteFinder = () => {
  const { etapa } = useParams<{ etapa: string }>();
  const [searchParams] = useSearchParams();
  const propertyName = searchParams.get('property') || 'Colinas de Juanito Laguna';
  
  const [numeroLote, setNumeroLote] = useState('');
  const [error, setError] = useState('');
  const [loteEncontrado, setLoteEncontrado] = useState<Lote | null>(null);

  const etapaNum = parseInt(etapa || '1', 10);

  const buscarLote = () => {
    setError('');
    
    if (!numeroLote.trim()) {
      setError('Por favor ingrese el número de lote');
      return;
    }

    const lote = COLINAS_LOTES.find(
      l => l.etapa === etapaNum && l.numero.toLowerCase() === numeroLote.trim().toLowerCase()
    );

    if (lote) {
      setLoteEncontrado(lote);
    } else {
      setError(`No se encontró el lote ${numeroLote} en la Etapa ${etapaNum}`);
    }
  };

  const abrirGoogleMaps = () => {
    if (loteEncontrado) {
      const origen = `${COLINAS_ENTRADA.latitude},${COLINAS_ENTRADA.longitude}`;
      const destino = `${loteEncontrado.latitude},${loteEncontrado.longitude}`;
      const url = `https://www.google.com/maps/dir/${origen}/${destino}`;
      window.open(url, '_blank');
    }
  };

  const abrirWaze = () => {
    if (loteEncontrado && loteEncontrado.latitude && loteEncontrado.longitude) {
      const url = `https://www.waze.com/ul?ll=${loteEncontrado.latitude}%2C${loteEncontrado.longitude}&navigate=yes&zoom=17`;
      window.open(url, '_blank');
    }
  };

  const reiniciarBusqueda = () => {
    setNumeroLote('');
    setLoteEncontrado(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Logo />
      
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {propertyName}
            </h1>
            <p className="text-lg text-primary font-semibold">
              Etapa {etapaNum}
            </p>
          </div>

          {!loteEncontrado ? (
            /* Formulario de búsqueda */
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-primary" />
                Ingrese su número de lote
              </h2>
              
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Ej: 1, 2, 3..."
                  value={numeroLote}
                  onChange={(e) => setNumeroLote(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarLote()}
                  className="text-center text-xl h-14"
                />
                
                {error && (
                  <p className="text-destructive text-sm text-center">{error}</p>
                )}
                
                <Button
                  onClick={buscarLote}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  Buscar Lote
                </Button>
              </div>
            </div>
          ) : (
            /* Lote encontrado */
            <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  ¡Lote Encontrado!
                </h2>
                <p className="text-muted-foreground mt-1">
                  {loteEncontrado.tipo === 'casa' ? 'Casa' : 'Lote'} {loteEncontrado.numero} - Etapa {loteEncontrado.etapa}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground text-center">
                  Coordenadas: {loteEncontrado.latitude.toFixed(6)}, {loteEncontrado.longitude.toFixed(6)}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={abrirGoogleMaps}
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Ver Ruta en Google Maps
                </Button>

                <Button
                  onClick={abrirWaze}
                  className="w-full h-12 text-lg bg-[#33CCFF] hover:bg-[#29B8E8] text-black"
                  size="lg"
                >
                  <Navigation className="w-5 h-5 mr-2" />
                  Ver Ruta en Waze
                </Button>
                
                <Button
                  onClick={reiniciarBusqueda}
                  variant="outline"
                  className="w-full"
                >
                  Buscar otro lote
                </Button>
              </div>
            </div>
          )}

          {/* Info */}
          <p className="text-center text-muted-foreground text-sm mt-6">
            Al abrir Google Maps, verá la ruta desde la entrada hasta su lote
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoteFinder;
