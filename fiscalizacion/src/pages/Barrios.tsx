import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface BarrioFeature {
  type: string;
  properties: {
    nombre: string;
    localidad: string;
    descripcion?: string;
    color?: string;
  };
  geometry: any;
}

interface CircuitoFeature {
  type: string;
  properties: {
    circuito: string;
    electores: number;
    porcentaje_fiscales: number;
  };
  geometry: any;
}

interface GeoJSONData {
  type: string;
  features: BarrioFeature[] | CircuitoFeature[];
  bbox?: [number, number, number, number];
}

export default function Barrios() {
  const [barriosData, setBarriosData] = useState<GeoJSONData | null>(null);
  const [circuitosData, setCircuitosData] = useState<GeoJSONData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocalidad, setSelectedLocalidad] = useState<string>('');
  const [center, setCenter] = useState<[number, number]>([-34.8200, -58.3700]);

  // Colores por localidad (fallback, se usan los del GeoJSON primero)
  const coloresPorLocalidad: Record<string, string> = {
    'Adrogué': '#EF4444',              // Rojo
    'Burzaco': '#F59E0B',              // Naranja
    'Claypole': '#3B82F6',             // Azul
    'Glew': '#10B981',                 // Verde
    'José Mármol': '#EC4899',          // Rosa
    'Longchamps': '#8B5CF6',           // Púrpura
    'Malvinas Argentinas': '#06B6D4',  // Cian
    'Ministro Rivadavia': '#F97316',   // Naranja oscuro
    'Rafael Calzada': '#84CC16',       // Lima
    'San Francisco de Asís': '#00D9FF', // Cian claro
    'San Francisco Solano': '#FBBF24', // Ámbar
    'San José': '#A78BFA',             // Violeta
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        
        // Cargar archivo COMPLETO con todos los barrios
        const respBarrios = await fetch(`${import.meta.env.BASE_URL}limites_barrios_brown_completo.geojson`);
        if (!respBarrios.ok) throw new Error('No se pudo cargar los barrios');
        
        const dataBarrios: GeoJSONData = await respBarrios.json();
        setBarriosData(dataBarrios);

        // Cargar circuitos electorales como referencia
        try {
          const respCircuitos = await fetch(`${import.meta.env.BASE_URL}circuitos_brown_precisos.geojson`);
          if (respCircuitos.ok) {
            const dataCircuitos: GeoJSONData = await respCircuitos.json();
            setCircuitosData(dataCircuitos);
          }
        } catch {
          // Sin circuitos no es crítico
        }

        if (dataBarrios.bbox && dataBarrios.bbox.length === 4) {
          const [lon_min, lat_min, lon_max, lat_max] = dataBarrios.bbox;
          const center_lon = (lon_min + lon_max) / 2;
          const center_lat = (lat_min + lat_max) / 2;
          setCenter([center_lat, center_lon]);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  const onEachBarrio = (feature: BarrioFeature, layer: any) => {
    const { nombre, localidad, descripcion } = feature.properties;
    
    const popupContent = `
      <div class="p-2">
        <h3 class="font-bold text-lg">${nombre}</h3>
        <p class="text-sm text-gray-600">${localidad}</p>
        ${descripcion ? `<p class="text-xs mt-1">${descripcion}</p>` : ''}
      </div>
    `;
    
    layer.bindPopup(popupContent);
    layer.on('mouseover', function() {
      this.setStyle({ weight: 2, opacity: 1, fillOpacity: 0.9 });
    });
    layer.on('mouseout', function() {
      this.setStyle({ weight: 1, opacity: 1, fillOpacity: 0.75 });
    });
  };

  // Obtener localidades únicas
  const localidades = barriosData
    ? [...new Set((barriosData.features as BarrioFeature[]).map(f => f.properties.localidad))].sort()
    : [];

  // Filtrar barrios por localidad seleccionada
  const barrios = barriosData && selectedLocalidad === ''
    ? barriosData.features
    : barriosData?.features.filter(f => 
        (f.properties as BarrioFeature['properties']).localidad === selectedLocalidad
      ) || [];

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">🗺️ Barrios de Almirante Brown (Completo)</h1>
        <p className="text-gray-600">Visualización completa de 173 barrios en 12 localidades según Ordenanza N° 13.906</p>
      </div>

      {/* Filtro por localidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrar por localidad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedLocalidad('')}
              className={`px-4 py-2 rounded transition ${
                selectedLocalidad === ''
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Todas ({barriosData?.features.length || 0})
            </button>
            
            {localidades.map(localidad => {
              const count = (barriosData?.features as BarrioFeature[]).filter(f => f.properties.localidad === localidad).length || 0;
              const color = coloresPorLocalidad[localidad] || '#888888';
              
              return (
                <button
                  key={localidad}
                  onClick={() => setSelectedLocalidad(localidad)}
                  className={`px-4 py-2 rounded transition flex items-center gap-2 ${
                    selectedLocalidad === localidad
                      ? 'ring-2 ring-black'
                      : 'hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: color,
                    opacity: selectedLocalidad === localidad ? 1 : 0.7,
                    color: 'white',
                  }}
                >
                  {localidad} ({count})
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mapa */}
      {loading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p>Cargando mapa...</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="h-screen relative">
            {/* @ts-ignore */}
            <MapContainer center={center} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
              {/* @ts-ignore */}
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Capa base: Circuitos electorales (como referencia tenue) */}
              {circuitosData && (
                <GeoJSON
                  key="circuitos-base"
                  data={circuitosData as any}
                  style={() => ({
                    color: '#999999',
                    weight: 1,
                    opacity: 0.3,
                    dashArray: '4',
                    fillColor: 'transparent',
                    fillOpacity: 0,
                  } as any)}
                  {...({} as any)}
                />
              )}
              
              {/* Capa principal: Barrios según Ordenanza */}
              {barrios.length > 0 && (
                <GeoJSON
                  key={`barrios-${selectedLocalidad}`}
                  data={{ type: 'FeatureCollection', features: barrios } as any}
                  style={(feature: any) => {
                    const color = feature.properties?.color || coloresPorLocalidad[feature.properties?.localidad] || '#888888';
                    return {
                      color: '#000000',
                      weight: 1,
                      fillColor: color,
                      fillOpacity: 0.75,
                    } as any;
                  }}
                  onEachFeature={(feature: any, layer: any) => {
                    const { nombre, localidad, descripcion } = feature.properties;
                    const popupContent = `
                      <div class="p-2">
                        <h3 class="font-bold text-lg">${nombre}</h3>
                        <p class="text-sm text-gray-600">${localidad}</p>
                        ${descripcion ? `<p class="text-xs mt-1">${descripcion}</p>` : ''}
                      </div>
                    `;
                    layer.bindPopup(popupContent);
                    layer.on('mouseover', function() {
                      this.setStyle({ weight: 2, opacity: 1, fillOpacity: 0.9 });
                    });
                    layer.on('mouseout', function() {
                      this.setStyle({ weight: 1, opacity: 1, fillOpacity: 0.75 });
                    });
                  }}
                  {...({} as any)}
                />
              )}
            </MapContainer>

            {/* Info panel */}
            <div className="absolute bottom-4 left-4 bg-white p-4 rounded shadow-lg z-10 max-w-xs">
              <h3 className="font-bold mb-2">📊 Información</h3>
              <p className="text-sm">
                Barrios visibles: <strong>{barrios.length}</strong>
              </p>
              {selectedLocalidad && (
                <p className="text-sm text-gray-600">
                  Localidad: <strong>{selectedLocalidad}</strong>
                </p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                Haz clic en un barrio para ver detalles
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Leyenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📍 Leyenda de Barrios</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {localidades.map(localidad => {
              const color = coloresPorLocalidad[localidad] || '#888888';
              const barrios_loc = (barriosData?.features as BarrioFeature[]).filter(f => f.properties.localidad === localidad);
              
              return (
                <div key={localidad} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 border border-black" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="font-semibold">{localidad}</span>
                  </div>
                  <ul className="text-sm text-gray-700 ml-6">
                    {barrios_loc.map(barrio => (
                      <li key={barrio.properties.nombre}>• {barrio.properties.nombre}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
