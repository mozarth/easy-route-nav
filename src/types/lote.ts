export interface Lote {
  id: string;
  etapa: number;
  numero: string;
  latitude: number;
  longitude: number;
  tipo: 'lote' | 'casa';
}

// Lotes de Colinas de Juanito Laguna
// Coordenadas de la entrada: 6°5'39.102"N 75°29'49.608"W (6.09420, -75.49711)
export const COLINAS_ENTRADA = {
  latitude: 6.09420,
  longitude: -75.49711,
};

export const COLINAS_LOTES: Lote[] = [
  // Etapa 1
  {
    id: 'e1-l1',
    etapa: 1,
    numero: '1',
    latitude: 6.105930,
    longitude: -75.488550,
    tipo: 'lote',
  },
  // Más lotes se pueden agregar aquí
];

export const getEtapas = (): number[] => {
  const etapas = [...new Set(COLINAS_LOTES.map(l => l.etapa))];
  return etapas.sort((a, b) => a - b);
};

export const getLotesByEtapa = (etapa: number): Lote[] => {
  return COLINAS_LOTES.filter(l => l.etapa === etapa);
};

export const getLoteById = (id: string): Lote | undefined => {
  return COLINAS_LOTES.find(l => l.id === id);
};

export const formatCoordinates = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  
  const latDeg = Math.floor(Math.abs(lat));
  const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
  const latSec = ((Math.abs(lat) - latDeg - latMin / 60) * 3600).toFixed(3);
  
  const lngDeg = Math.floor(Math.abs(lng));
  const lngMin = Math.floor((Math.abs(lng) - lngDeg) * 60);
  const lngSec = ((Math.abs(lng) - lngDeg - lngMin / 60) * 3600).toFixed(3);
  
  return `${latDeg}°${latMin}'${latSec}"${latDir} ${lngDeg}°${lngMin}'${lngSec}"${lngDir}`;
};
