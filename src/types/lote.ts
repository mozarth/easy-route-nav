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
  { id: 'e1-l1', etapa: 1, numero: '1', latitude: 6.105930, longitude: -75.488550, tipo: 'lote' },
  { id: 'e1-l2', etapa: 1, numero: '2', latitude: 6.105980, longitude: -75.488600, tipo: 'lote' },
  { id: 'e1-l3', etapa: 1, numero: '3', latitude: 6.106030, longitude: -75.488650, tipo: 'lote' },
  { id: 'e1-l4', etapa: 1, numero: '4', latitude: 6.106080, longitude: -75.488700, tipo: 'lote' },
  { id: 'e1-l5', etapa: 1, numero: '5', latitude: 6.106130, longitude: -75.488750, tipo: 'lote' },
  { id: 'e1-c1', etapa: 1, numero: '1', latitude: 6.106180, longitude: -75.488800, tipo: 'casa' },
  { id: 'e1-c2', etapa: 1, numero: '2', latitude: 6.106230, longitude: -75.488850, tipo: 'casa' },
  // Etapa 2
  { id: 'e2-l1', etapa: 2, numero: '1', latitude: 6.106280, longitude: -75.488900, tipo: 'lote' },
  { id: 'e2-l2', etapa: 2, numero: '2', latitude: 6.106330, longitude: -75.488950, tipo: 'lote' },
  { id: 'e2-l3', etapa: 2, numero: '3', latitude: 6.106380, longitude: -75.489000, tipo: 'lote' },
  // Etapa 3
  { id: 'e3-l1', etapa: 3, numero: '1', latitude: 6.106430, longitude: -75.489050, tipo: 'lote' },
  { id: 'e3-l2', etapa: 3, numero: '2', latitude: 6.106480, longitude: -75.489100, tipo: 'lote' },
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
