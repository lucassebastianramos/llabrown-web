/**
 * Utilidades geoespaciales y búsqueda territorial para Almirante Brown
 */

export interface BarrioProperties {
  nombre: string;
  localidad: string;
  anexo: string;
  color: string;
  center?: [number, number];
}

export interface StreetItem {
  n: string;
  lat: number;
  lng: number;
}

export interface SearchResult {
  title: string;
  subtitle: string;
  type: 'barrio' | 'calle' | 'localidad';
  lat: number;
  lng: number;
  zoom: number;
  badge?: string;
  color?: string;
}

/**
 * Normaliza cadenas de texto para búsqueda insensible a acentos y mayúsculas
 */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Algoritmo ray-casting para verificar si un punto [lng, lat] está dentro de un anillo de polígono
 */
export function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Detecta el barrio oficial según Ordenanza N° 13.906 para unas coordenadas dadas
 */
export function detectBarrio(
  lat: number,
  lng: number,
  barriosGeoJSON: any
): BarrioProperties | null {
  if (!barriosGeoJSON || !Array.isArray(barriosGeoJSON.features)) return null;

  // 1. Verificación precisa punto-en-polígono
  for (const feature of barriosGeoJSON.features) {
    const geom = feature.geometry;
    if (geom && geom.type === 'Polygon' && Array.isArray(geom.coordinates?.[0])) {
      if (isPointInPolygon([lng, lat], geom.coordinates[0])) {
        return feature.properties as BarrioProperties;
      }
    }
  }

  // 2. Si cayó en el borde exterior inmediato de una calle límite, encontrar el barrio más cercano
  return findNearestBarrio(lat, lng, barriosGeoJSON);
}

/**
 * Encuentra el barrio más cercano por distancia euclidiana al centroide
 */
export function findNearestBarrio(
  lat: number,
  lng: number,
  barriosGeoJSON: any
): BarrioProperties | null {
  if (!barriosGeoJSON || !Array.isArray(barriosGeoJSON.features)) return null;

  let closest: BarrioProperties | null = null;
  let minDistance = Infinity;

  for (const feature of barriosGeoJSON.features) {
    const props = feature.properties as BarrioProperties;
    const center = props.center;
    if (center && Array.isArray(center) && center.length === 2) {
      const dist = Math.hypot(lat - center[0], lng - center[1]);
      if (dist < minDistance) {
        minDistance = dist;
        closest = props;
      }
    }
  }

  // Solo devuelve si está a una distancia prudente (dentro de Almirante Brown)
  if (minDistance < 0.05) {
    return closest;
  }
  return null;
}

/**
 * Búsqueda territorial unificada: Calles, Barrios y Localidades de Almirante Brown
 */
export function searchBrownTerritory(
  query: string,
  calles: StreetItem[],
  barriosGeoJSON: any
): SearchResult[] {
  const q = normalizeText(query);
  if (!q || q.length < 2) return [];

  const results: SearchResult[] = [];

  // 1. Buscar en Barrios oficiales (Ordenanza 13.906)
  if (barriosGeoJSON?.features) {
    for (const f of barriosGeoJSON.features) {
      const p = f.properties as BarrioProperties;
      const nomNorm = normalizeText(p.nombre);
      const locNorm = normalizeText(p.localidad);

      if (nomNorm.includes(q) || `${nomNorm} ${locNorm}`.includes(q)) {
        const center = p.center || [-34.825, -58.38];
        results.push({
          title: p.nombre,
          subtitle: `Barrio oficial · ${p.localidad} (Ord. 13.906)`,
          type: 'barrio',
          lat: center[0],
          lng: center[1],
          zoom: 15,
          badge: 'Barrio',
          color: p.color
        });
      }
      if (results.length >= 4) break;
    }
  }

  // 2. Buscar en las 1.484 Calles y Avenidas de Almirante Brown
  if (Array.isArray(calles)) {
    for (const street of calles) {
      const streetNorm = normalizeText(street.n);
      if (streetNorm.includes(q)) {
        // Evitar duplicados exactos si ya está en la lista
        if (!results.some((r) => r.title.toLowerCase() === street.n.toLowerCase())) {
          results.push({
            title: street.n,
            subtitle: 'Calle / Arteria de Almirante Brown',
            type: 'calle',
            lat: street.lat,
            lng: street.lng,
            zoom: 16.5,
            badge: 'Calle'
          });
        }
      }
      if (results.length >= 8) break;
    }
  }

  return results.slice(0, 8);
}
