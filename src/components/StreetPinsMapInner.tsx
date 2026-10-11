'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import { PinTerritorial, LocalidadNombre } from '@/types';
import { LOCALIDADES } from '@/data/mockData';
import { 
  detectBarrio, 
  searchBrownTerritory, 
  SearchResult, 
  StreetItem,
  BarrioProperties 
} from '@/lib/geoUtils';
import { 
  MapPin, 
  Filter, 
  FileText, 
  Download, 
  ThumbsUp, 
  Send,
  Building2,
  X, 
  Search,
  Layers,
  Compass,
  Check,
  Map as MapIcon,
  MessageCircle,
  Vote,
  School
} from 'lucide-react';

interface Props {
  initialPins?: PinTerritorial[];
}

export interface CircuitoProperties {
  circuito?: string;
  circuitoCode?: string;
  nombre: string;
  descripcion?: string;
  localidadesPrincipales?: string[];
  referente?: string;
  wa?: string;
  color?: string;
  electores?: number;
  establecimientosCount?: number;
}

const CARTO_KEY = 'cb1_4gpl_1_91252c0c164ed9fcbdef50a7';

const BASEMAP_STYLES = {
  esri: {
    id: 'esri',
    name: 'ESRI Calles',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Map &copy; Esri &mdash; Almirante Brown',
    maxZoom: 19,
    subdomains: 'abc',
  },
  'carto-dark': {
    id: 'carto-dark',
    name: 'CARTO Obsidiana',
    url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  'carto-voyager': {
    id: 'carto-voyager',
    name: 'CARTO Voyager',
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 20,
    subdomains: 'abcd',
  },
};

type BasemapKey = keyof typeof BASEMAP_STYLES;

export default function StreetPinsMapInner({ initialPins = [] }: Props) {
  const [pins, setPins] = useState<PinTerritorial[]>(initialPins);
  const [selectedPin, setSelectedPin] = useState<PinTerritorial | null>(null);
  const [selectedBarrioInfo, setSelectedBarrioInfo] = useState<BarrioProperties | null>(null);
  const [selectedCircuitoInfo, setSelectedCircuitoInfo] = useState<CircuitoProperties | null>(null);

  // Basemap style switcher
  const [basemapStyle, setBasemapStyle] = useState<BasemapKey>('esri');

  // Filters
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [selectedLocalidad, setSelectedLocalidad] = useState<string>('Todas');
  const [selectedBarrioFilter, setSelectedBarrioFilter] = useState<string>('Todos');

  // Layer toggles
  const [showPinsLayer, setShowPinsLayer] = useState<boolean>(true);
  const [showBarriosLayer, setShowBarriosLayer] = useState<boolean>(true);
  const [showCircuitosLayer, setShowCircuitosLayer] = useState<boolean>(false);

  // Territorial data
  const [barriosGeoJSON, setBarriosGeoJSON] = useState<any | null>(null);
  const [circuitosGeoJSON, setCircuitosGeoJSON] = useState<any | null>(null);
  const [callesData, setCallesData] = useState<StreetItem[]>([]);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [supportedPins, setSupportedPins] = useState<Record<string, boolean>>({});

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const barriosLayerRef = useRef<L.GeoJSON | null>(null);
  const circuitosLayerRef = useRef<L.GeoJSON | null>(null);
  const highlightLayerRef = useRef<L.LayerGroup | null>(null);

  // Fetch live pins from API
  useEffect(() => {
    fetch('/api/pines')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPins(data);
        }
      })
      .catch((err) => console.warn('Using initial pins:', err));
  }, []);

  // Fetch barrios, calles and circuitos data
  useEffect(() => {
    fetch('/data/almirante-brown-barrios.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBarriosGeoJSON(d))
      .catch((e) => console.warn('Could not load barrios GeoJSON:', e));

    fetch('/data/almirante-brown-calles.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCallesData(Array.isArray(d) ? d : []))
      .catch((e) => console.warn('Could not load calles data:', e));

    fetch('/data/almirante-brown-circuitos.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCircuitosGeoJSON(d))
      .catch((e) => console.warn('Could not load circuitos data:', e));
  }, []);

  // Pin count by localidad
  const pinCountByLocalidad = useMemo(() => {
    const counts: Record<string, number> = {};
    pins.forEach((p) => {
      counts[p.localidad] = (counts[p.localidad] || 0) + 1;
    });
    return counts;
  }, [pins]);

  // Barrios list for the selected localidad
  const barriosOfSelectedLocalidad: BarrioProperties[] = useMemo(() => {
    if (!barriosGeoJSON?.features) return [];
    if (selectedLocalidad === 'Todas') {
      return barriosGeoJSON.features.map((f: any) => f.properties as BarrioProperties);
    }
    return barriosGeoJSON.features
      .map((f: any) => f.properties as BarrioProperties)
      .filter((p: BarrioProperties) => p.localidad.toLowerCase() === selectedLocalidad.toLowerCase());
  }, [barriosGeoJSON, selectedLocalidad]);

  // Handle Search Input
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const results = searchBrownTerritory(searchQuery, callesData, barriosGeoJSON);
    setSearchResults(results);
  }, [searchQuery, callesData, barriosGeoJSON]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Límites territoriales estrictos de Almirante Brown
    const southWest = L.latLng(-34.918, -58.455);
    const northEast = L.latLng(-34.748, -58.285);
    const brownBounds = L.latLngBounds(southWest, northEast);

    const map = L.map(mapContainerRef.current, {
      center: [-34.825, -58.380],
      zoom: 12.5,
      minZoom: 12,
      maxZoom: 18,
      maxBounds: brownBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial TileLayer (ESRI)
    const initialConfig = BASEMAP_STYLES.esri;
    const tileLayer = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxZoom: initialConfig.maxZoom,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Cargar máscara perimetral oscura para aislar Almirante Brown
    fetch('/data/almirante-brown-rings.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((rings: [number, number][][]) => {
        if (!rings || !Array.isArray(rings) || !mapInstanceRef.current) return;
        const outerWorld: [number, number][] = [
          [-90, -180],
          [-90, 180],
          [90, 180],
          [90, -180]
        ];

        L.polygon([outerWorld, ...rings], {
          fillColor: '#08040d',
          fillOpacity: 0.93,
          stroke: false,
          interactive: false,
        }).addTo(mapInstanceRef.current);

        rings.forEach((ring) => {
          L.polyline(ring, {
            color: '#a855f7',
            weight: 2,
            opacity: 0.85,
            interactive: false,
          }).addTo(mapInstanceRef.current!);
        });
      })
      .catch((e) => console.warn('Could not load mask rings:', e));

    markersLayerRef.current = L.layerGroup().addTo(map);
    highlightLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Basemap when basemapStyle changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const cfg = BASEMAP_STYLES[basemapStyle];
    tileLayerRef.current.setUrl(cfg.url);
  }, [basemapStyle]);

  // Manage Circuitos Layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (circuitosLayerRef.current) {
      circuitosLayerRef.current.remove();
      circuitosLayerRef.current = null;
    }

    if (showCircuitosLayer && circuitosGeoJSON) {
      circuitosLayerRef.current = L.geoJSON(circuitosGeoJSON, {
        style: {
          color: '#38bdf8',
          weight: 2,
          opacity: 0.75,
          dashArray: '5, 6',
          fillColor: '#0284c7',
          fillOpacity: 0.1,
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties as CircuitoProperties;
          layer.bindTooltip(`<strong>Circuito ${p.circuitoCode || p.circuito || ''}</strong><br/>${p.nombre || ''}`, {
            direction: 'center',
            className: 'custom-leaflet-tooltip'
          });

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({ weight: 3.5, opacity: 1, fillOpacity: 0.35, color: '#38bdf8' });
              l.bringToFront();
            },
            mouseout: (e) => {
              const l = e.target;
              l.setStyle({ weight: 2, opacity: 0.75, fillOpacity: 0.1, color: '#38bdf8' });
            },
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              setSelectedCircuitoInfo(p);
              setSelectedBarrioInfo(null);
              setSelectedPin(null);
            }
          });
        }
      }).addTo(mapInstanceRef.current);
    }
  }, [showCircuitosLayer, circuitosGeoJSON]);

  // Manage Barrios Layer (Ordenanza 13.906)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (barriosLayerRef.current) {
      barriosLayerRef.current.remove();
      barriosLayerRef.current = null;
    }

    if (showBarriosLayer && barriosGeoJSON) {
      barriosLayerRef.current = L.geoJSON(barriosGeoJSON, {
        style: (feature) => {
          const color = feature?.properties?.color || '#a855f7';
          return {
            color: color,
            weight: 1.2,
            opacity: 0.65,
            fillColor: color,
            fillOpacity: 0.16,
            dashArray: '2, 3'
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties as BarrioProperties;
          layer.bindTooltip(`<strong>${p.nombre}</strong><br/><span style="opacity:0.8;font-size:10px;">${p.localidad} (Ord. 13.906)</span>`, {
            sticky: true,
            className: 'custom-leaflet-tooltip'
          });

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({
                weight: 2.8,
                opacity: 1,
                fillOpacity: 0.45,
                color: '#fbbf24'
              });
              l.bringToFront();
            },
            mouseout: (e) => {
              const l = e.target;
              const color = feature?.properties?.color || '#a855f7';
              l.setStyle({
                color: color,
                weight: 1.2,
                opacity: 0.65,
                fillOpacity: 0.16
              });
            },
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              setSelectedBarrioInfo(p);
              setSelectedCircuitoInfo(null);
              setSelectedPin(null);
              if (p.center && mapInstanceRef.current) {
                mapInstanceRef.current.flyTo(p.center, 15);
              }
            }
          });
        }
      }).addTo(mapInstanceRef.current);
    }
  }, [showBarriosLayer, barriosGeoJSON]);

  // Update Pin Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    if (!showPinsLayer) return;

    const filtered = pins.filter((pin) => {
      const matchCat = selectedCategoria === 'Todas' || pin.categoria === selectedCategoria;
      const matchLoc = selectedLocalidad === 'Todas' || pin.localidad === selectedLocalidad;
      const matchBarrio = selectedBarrioFilter === 'Todos' || (pin.barrio && pin.barrio === selectedBarrioFilter);
      return matchCat && matchLoc && matchBarrio;
    });

    filtered.forEach((pin) => {
      let color = '#f59e0b';
      let iconSvg = '<path d="M4 14h8M5 14l2-8h2l2 8M7 9h2" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>';
      if (pin.categoria.includes('Seguridad')) {
        color = '#2563eb';
        iconSvg = '<path d="M8 2l5 2.5v4c0 3.5-2.2 6.5-5 7.5-2.8-1-5-4-5-7.5v-4L8 2z" stroke="#ffffff" stroke-width="1.5" fill="none"/>';
      } else if (pin.categoria.includes('Ordenanza') || pin.categoria.includes('HCD')) {
        color = '#6b21a8';
        iconSvg = '<path d="M2 14h12M4 14V6M8 14V6M12 14V6M2 6h12M8 2L2 6h12L8 2z" stroke="#ffffff" stroke-width="1.4" fill="none"/>';
      } else if (pin.categoria.includes('Visita')) {
        color = '#059669';
        iconSvg = '<path d="M8 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14a5 5 0 0110 0H3z" stroke="#ffffff" stroke-width="1.5" fill="none"/>';
      } else if (pin.categoria.includes('Salud')) {
        color = '#dc2626';
        iconSvg = '<path d="M8 4v8M4 8h8" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>';
      } else if (pin.categoria.includes('Medio Ambiente')) {
        color = '#0d9488';
        iconSvg = '<path d="M4 12c0-4 4-8 8-8 0 4-4 8-8 8zm0 0l4-4" stroke="#ffffff" stroke-width="1.6" fill="none"/>';
      }

      const icon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">
            <svg width="30" height="38" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.16 0 0 7.16 0 16c0 10.5 14.8 23.3 15.4 23.8.4.3.9.3 1.2 0C17.2 39.3 32 26.5 32 16c0-8.84-7.16-16-16-16z" fill="${color}"/>
              <path d="M16 1C7.72 1 1 7.72 1 16c0 9.8 14.2 22.3 15 23 0.8-.7 15-13.2 15-23C31 7.72 24.28 1 16 1z" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.85"/>
              <g transform="translate(8, 6)">
                ${iconSvg}
              </g>
            </svg>
          </div>
        `,
        iconSize: [30, 38],
        iconAnchor: [15, 38],
      });

      const marker = L.marker([pin.lat, pin.lng], { icon });
      marker.on('click', () => {
        setSelectedPin(pin);
        setSelectedBarrioInfo(null);
        setSelectedCircuitoInfo(null);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([pin.lat, pin.lng]);
        }
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [pins, selectedCategoria, selectedLocalidad, selectedBarrioFilter, showPinsLayer]);

  const handleSupport = async (pinId: string) => {
    if (supportedPins[pinId]) return;
    setSupportedPins((prev) => ({ ...prev, [pinId]: true }));

    setPins((prev) =>
      prev.map((p) => (p.id === pinId ? { ...p, apoyosVecinales: (p.apoyosVecinales || 0) + 1 } : p))
    );
    if (selectedPin && selectedPin.id === pinId) {
      setSelectedPin((prev) => prev ? { ...prev, apoyosVecinales: (prev.apoyosVecinales || 0) + 1 } : null);
    }

    try {
      await fetch(`/api/pines/${pinId}`, { method: 'PATCH' });
    } catch (e) {
      console.warn('Supported locally:', e);
    }
  };

  const handleSelectSearchResult = (res: SearchResult) => {
    if (!mapInstanceRef.current) return;
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);

    mapInstanceRef.current.flyTo([res.lat, res.lng], res.zoom);

    if (highlightLayerRef.current) {
      highlightLayerRef.current.clearLayers();

      const pulseIcon = L.divIcon({
        className: 'search-pulse-icon',
        html: `
          <div style="position:relative; width:36px; height:36px;">
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#f59e0b; opacity:0.75; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute; top:6px; left:6px; width:24px; height:24px; border-radius:50%; background:#7e22ce; border:2px solid #fbbf24; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:bold;">📍</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const pulseMarker = L.marker([res.lat, res.lng], { icon: pulseIcon }).addTo(highlightLayerRef.current);
      setTimeout(() => {
        if (highlightLayerRef.current) highlightLayerRef.current.removeLayer(pulseMarker);
      }, 7000);
    }

    if (res.type === 'barrio') {
      const bMatch = barriosGeoJSON?.features?.find((f: any) => f.properties.nombre === res.title);
      if (bMatch) {
        setSelectedBarrioInfo(bMatch.properties as BarrioProperties);
        setSelectedCircuitoInfo(null);
      }
    }
  };

  const categories = [
    'Todas',
    'Arreglo de Calles / Asfalto',
    'Seguridad / Luminarias',
    'Proyecto de Ordenanza HCD',
    'Visita Vecinal / Reclamo',
    'Salud / CAPS',
    'Medio Ambiente / Basurales'
  ];

  // Count pins inside selected barrio
  const pinsInSelectedBarrio = useMemo(() => {
    if (!selectedBarrioInfo) return [];
    return pins.filter(p => {
      if (p.barrio && p.barrio.toLowerCase() === selectedBarrioInfo.nombre.toLowerCase()) return true;
      if (barriosGeoJSON) {
        const detected = detectBarrio(p.lat, p.lng, barriosGeoJSON);
        return detected?.nombre.toLowerCase() === selectedBarrioInfo.nombre.toLowerCase();
      }
      return false;
    });
  }, [pins, selectedBarrioInfo, barriosGeoJSON]);

  // Count pins inside selected circuito
  const pinsInSelectedCircuito = useMemo(() => {
    if (!selectedCircuitoInfo || !selectedCircuitoInfo.localidadesPrincipales) return [];
    const locs = selectedCircuitoInfo.localidadesPrincipales.map(l => l.toLowerCase());
    return pins.filter(p => locs.includes(p.localidad.toLowerCase()));
  }, [pins, selectedCircuitoInfo]);

  return (
    <div className="flex flex-col gap-5">
      {/* Search, Basemap Style & Top Action Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 glass-panel p-3.5 rounded-2xl border border-purple-500/30">
        
        {/* Instant Search in Almirante Brown */}
        <div className="relative flex-1 max-w-lg">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-amber-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              placeholder="Buscar entre 1.484 calles y 155 barrios oficiales de Brown..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-purple-950/80 border border-purple-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearching(false);
                }}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#120722] border border-purple-600/60 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-purple-900/50 backdrop-blur-md">
              <div className="p-2 bg-purple-950/70 text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Resultados en Almirante Brown</span>
                <span className="text-amber-400">{searchResults.length} encontrados</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((res, i) => (
                  <button
                    key={`${res.title}-${i}`}
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-purple-900/50 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${res.type === 'barrio' ? 'bg-amber-400' : 'bg-sky-400'}`} />
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">{res.title}</span>
                        <span className="text-[10px] text-slate-300 truncate">{res.subtitle}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                      res.type === 'barrio' 
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                        : 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                    }`}>
                      {res.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controls: Basemap Style (ESRI / CARTO) & Layers */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Basemap Style Picker */}
          <div className="flex items-center gap-1 bg-purple-950/80 p-1 rounded-xl border border-purple-800/80">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-1.5 hidden sm:inline">
              Estilo:
            </span>
            {(['esri', 'carto-dark', 'carto-voyager'] as BasemapKey[]).map((key) => {
              const cfg = BASEMAP_STYLES[key];
              const isActive = basemapStyle === key;
              return (
                <button
                  key={key}
                  onClick={() => setBasemapStyle(key)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-700 to-amber-500 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-purple-900/50'
                  }`}
                  title={`Cambiar a ${cfg.name}`}
                >
                  {cfg.name}
                </button>
              );
            })}
          </div>

          {/* Map Layers Toggles (Pines, Barrios, Circuitos) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPinsLayer(!showPinsLayer)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showPinsLayer
                  ? 'bg-amber-400 text-purple-950 font-bold shadow-md'
                  : 'bg-purple-950/60 hover:bg-purple-900/60 text-slate-400 border border-purple-900/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Pines</span>
              {showPinsLayer && <Check className="w-3 h-3 stroke-[3]" />}
            </button>

            <button
              onClick={() => setShowBarriosLayer(!showBarriosLayer)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showBarriosLayer
                  ? 'bg-purple-700 text-white font-bold shadow-md border border-purple-400'
                  : 'bg-purple-950/60 hover:bg-purple-900/60 text-slate-400 border border-purple-900/60'
              }`}
              title="Límites oficiales de los 155 barrios según Ordenanza N° 13.906 de Almirante Brown"
            >
              <Building2 className="w-3.5 h-3.5 text-purple-300" />
              <span>Barrios (155)</span>
              {showBarriosLayer && <Check className="w-3 h-3 stroke-[3]" />}
            </button>

            <button
              onClick={() => setShowCircuitosLayer(!showCircuitosLayer)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showCircuitosLayer
                  ? 'bg-sky-600 text-white font-bold shadow-md border border-sky-400'
                  : 'bg-purple-950/60 hover:bg-purple-900/60 text-slate-400 border border-purple-900/60'
              }`}
              title="Superponer los 11 circuitos electorales oficiales"
            >
              <Compass className="w-3.5 h-3.5 text-sky-300" />
              <span>Circuitos</span>
              {showCircuitosLayer && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 glass-panel rounded-2xl border border-purple-900/40">
        <span className="text-[11px] font-bold text-slate-300 uppercase flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-amber-400" />
          Tema:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategoria(cat)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedCategoria === cat
                ? 'bg-amber-400 text-purple-950 font-bold shadow-md'
                : 'bg-purple-950/40 hover:bg-purple-900/60 text-slate-300 border border-purple-900/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Localities Quick Filter Chips with Pin Counter */}
      <div className="p-3 glass-panel rounded-2xl border border-purple-900/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Localidades de Almirante Brown:
          </span>

          {/* Barrio sub-filter selector if a localidad is chosen */}
          {selectedLocalidad !== 'Todas' && barriosOfSelectedLocalidad.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-300 text-[11px] font-semibold">Barrio:</span>
              <select
                value={selectedBarrioFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedBarrioFilter(val);
                  if (val !== 'Todos') {
                    const match = barriosOfSelectedLocalidad.find((b: BarrioProperties) => b.nombre === val);
                    if (match && match.center && mapInstanceRef.current) {
                      mapInstanceRef.current.flyTo(match.center, 15.5);
                      setSelectedBarrioInfo(match);
                      setSelectedCircuitoInfo(null);
                    }
                  }
                }}
                className="px-2.5 py-1 rounded-lg bg-purple-950/90 border border-purple-700 text-white text-xs focus:outline-none focus:border-amber-400"
              >
                <option value="Todos">Todos los barrios de {selectedLocalidad} ({barriosOfSelectedLocalidad.length})</option>
                {barriosOfSelectedLocalidad.map((b) => (
                  <option key={b.nombre} value={b.nombre}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => {
              setSelectedLocalidad('Todas');
              setSelectedBarrioFilter('Todos');
              if (mapInstanceRef.current) mapInstanceRef.current.flyTo([-34.825, -58.380], 12.5);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedLocalidad === 'Todas'
                ? 'bg-gradient-to-r from-purple-700 to-amber-500 text-white shadow-md'
                : 'bg-purple-950/50 hover:bg-purple-900/60 text-slate-300 border border-purple-900/60'
            }`}
          >
            <span>Todas</span>
            <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-black text-amber-300">
              {pins.length}
            </span>
          </button>

          {LOCALIDADES.map((l) => {
            const count = pinCountByLocalidad[l.nombre] || 0;
            const isSelected = selectedLocalidad === l.nombre;
            return (
              <button
                key={l.id}
                onClick={() => {
                  setSelectedLocalidad(l.nombre);
                  setSelectedBarrioFilter('Todos');
                  if (mapInstanceRef.current) mapInstanceRef.current.flyTo(l.coordenadas, 14);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-700 to-amber-500 text-white shadow-md'
                    : 'bg-purple-950/40 hover:bg-purple-900/60 text-slate-300 border border-purple-900/50'
                }`}
              >
                <span>{l.nombre}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-black/40 text-amber-300' : 'bg-purple-900/80 text-amber-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Map + Detail Modal / Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Map Canvas (8 cols) */}
        <div className="lg:col-span-8 glass-panel rounded-3xl p-3 sm:p-4 border border-purple-500/30 shadow-2xl relative">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Pines Territoriales, Barrios & Circuitos de Brown
            </span>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
              {pins.length} Reclamos y Obras · 155 Barrios · 11 Circuitos
            </span>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[540px] rounded-2xl overflow-hidden border border-purple-900/60 z-0"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-2 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Calles / Asfalto</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Seguridad</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#371859] border border-purple-400" /> HCD</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Visitas</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Límite Barrial</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Circuito</span>
            </div>
            <span className="text-purple-300 font-medium">Hacé click en un pin, barrio o circuito para ver su ficha</span>
          </div>
        </div>

        {/* Detail Panel of Selected Pin, Barrio or Circuito (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* 1. Selected Circuito Card (inspired by elecciones-ARG) */}
          {selectedCircuitoInfo && (
            <div className="glass-panel rounded-3xl p-5 border border-sky-400/50 shadow-2xl relative animate-fadeIn">
              <button
                onClick={() => setSelectedCircuitoInfo(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-purple-950/80 hover:bg-purple-900 text-slate-300 hover:text-white border border-purple-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2 pr-6">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[11px] font-bold border border-sky-400/40">
                  Circuito {selectedCircuitoInfo.circuitoCode || selectedCircuitoInfo.circuito}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 text-[10px] font-semibold">
                  Sección 3ra PBA
                </span>
              </div>

              <h3 className="text-xl font-black text-white mb-1">
                {selectedCircuitoInfo.nombre}
              </h3>
              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                {selectedCircuitoInfo.descripcion || 'Zona electoral y territorial de Almirante Brown.'}
              </p>

              {/* Electoral stats from elecciones-ARG */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-center">
                  <Vote className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Electores</span>
                  <span className="text-sm font-black text-white">
                    {selectedCircuitoInfo.electores ? selectedCircuitoInfo.electores.toLocaleString('es-AR') : '28.000+'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-center">
                  <School className="w-4 h-4 text-sky-400 mx-auto mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Escuelas</span>
                  <span className="text-sm font-black text-white">
                    {selectedCircuitoInfo.establecimientosCount || 15} centros
                  </span>
                </div>
              </div>

              {/* Localities covered */}
              {selectedCircuitoInfo.localidadesPrincipales && (
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/60 mb-4 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Localidades comprendidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCircuitoInfo.localidadesPrincipales.map(loc => (
                      <span key={loc} className="px-2 py-0.5 rounded-lg bg-purple-900/60 text-slate-200 font-semibold text-[11px]">
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Related LLA Pins in this zone */}
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/60 mb-4 text-xs">
                <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">
                  Reclamos & Obras en esta zona: {pinsInSelectedCircuito.length}
                </span>
                {pinsInSelectedCircuito.length > 0 ? (
                  <div className="space-y-1.5 mt-1">
                    {pinsInSelectedCircuito.slice(0, 3).map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPin(p);
                          setSelectedCircuitoInfo(null);
                        }}
                        className="w-full text-left p-1.5 rounded-lg bg-purple-900/40 hover:bg-purple-800 text-xs text-slate-200 truncate block"
                      >
                        • {p.titulo}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">No hay reclamos cargados para este circuito.</span>
                )}
              </div>

              {/* Referente WhatsApp Contact */}
              {selectedCircuitoInfo.wa && (
                <a
                  href={selectedCircuitoInfo.wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Contactar Referente del Circuito</span>
                </a>
              )}
            </div>
          )}

          {/* 2. Selected Barrio Card (if clicked) */}
          {selectedBarrioInfo && !selectedPin && !selectedCircuitoInfo && (
            <div className="glass-panel rounded-3xl p-5 border border-purple-400/50 shadow-2xl relative animate-fadeIn">
              <button
                onClick={() => setSelectedBarrioInfo(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-purple-950/80 hover:bg-purple-900 text-slate-300 hover:text-white border border-purple-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2 pr-6">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-900/60 text-purple-200 text-[11px] font-bold border border-purple-700/60">
                  {selectedBarrioInfo.localidad}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 text-[10px] font-semibold border border-amber-400/30">
                  {selectedBarrioInfo.anexo}
                </span>
              </div>

              <h3 className="text-xl font-black text-white mb-1">
                {selectedBarrioInfo.nombre}
              </h3>
              <p className="text-xs text-purple-300 mb-4">
                Subdivisión barrial oficial según Ordenanza N° 13.906 del HCD de Almirante Brown.
              </p>

              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/60 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-300 font-semibold">Pines activos en este barrio:</span>
                  <span className="text-xs font-black text-amber-300 px-2 py-0.5 rounded-full bg-amber-400/20">
                    {pinsInSelectedBarrio.length}
                  </span>
                </div>
                {pinsInSelectedBarrio.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {pinsInSelectedBarrio.slice(0, 3).map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPin(p)}
                        className="w-full text-left p-2 rounded-lg bg-purple-900/40 hover:bg-purple-800/60 text-xs text-slate-200 font-medium transition-colors truncate block"
                      >
                        • {p.titulo}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Aún no hay reclamos cargados en este barrio. Podés comunicarte con tu referente de {selectedBarrioInfo.localidad}.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedLocalidad(selectedBarrioInfo.localidad as LocalidadNombre);
                    setSelectedBarrioFilter(selectedBarrioInfo.nombre);
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-700 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Filtrar mapa a este barrio
                </button>
              </div>
            </div>
          )}

          {/* 3. Selected Pin Card (if clicked) */}
          {selectedPin ? (
            <div className="glass-panel rounded-3xl p-6 border border-amber-400/50 shadow-2xl relative animate-fadeIn flex flex-col justify-between">
              <button
                onClick={() => setSelectedPin(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-purple-950/80 hover:bg-purple-900 text-slate-300 hover:text-white border border-purple-800"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3 pr-8">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
                    {selectedPin.categoria}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200 text-[10px] font-semibold">
                    {selectedPin.estado}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white mb-2 leading-snug">
                  {selectedPin.titulo}
                </h3>

                <div className="flex flex-col gap-1 text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{selectedPin.calle} · {selectedPin.localidad}</span>
                  </div>
                  {/* Official Barrio indication */}
                  <div className="flex items-center gap-1.5 text-purple-300 text-[11px] font-medium ml-5">
                    <span>
                      Barrio: <strong>{selectedPin.barrio || (barriosGeoJSON ? detectBarrio(selectedPin.lat, selectedPin.lng, barriosGeoJSON)?.nombre : 'Sin especificar')}</strong> (Ord. 13.906)
                    </span>
                  </div>
                </div>

                {/* Photos if any */}
                {selectedPin.fotos && selectedPin.fotos.length > 0 && (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden mb-4 border border-purple-800/60">
                    <Image
                      src={selectedPin.fotos[0]}
                      alt={selectedPin.titulo}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <p className="text-xs text-slate-200 leading-relaxed mb-4">
                  {selectedPin.descripcion}
                </p>

                {/* Concejal */}
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/50 mb-4 text-xs">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Concejal Responsable / Autor:
                  </span>
                  <span className="text-white font-bold block mt-0.5">
                    {selectedPin.concejal}
                  </span>
                </div>

                {/* Attached PDF */}
                {selectedPin.pdfUrl && (
                  <a
                    href={selectedPin.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-900/70 border border-purple-700/60 text-amber-300 font-bold text-xs flex items-center justify-between mb-4 transition-all"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">{selectedPin.pdfNombre || 'Proyecto de Ordenanza (PDF)'}</span>
                    </span>
                    <Download className="w-4 h-4 shrink-0" />
                  </a>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-purple-900/40 space-y-2">
                <button
                  onClick={() => handleSupport(selectedPin.id)}
                  disabled={supportedPins[selectedPin.id]}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    supportedPins[selectedPin.id]
                      ? 'bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 cursor-default'
                      : 'bg-gradient-to-r from-purple-700 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white shadow-md'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>
                    {supportedPins[selectedPin.id] ? '¡Apoyo Registrado!' : `Apoyar este Pedido (${selectedPin.apoyosVecinales || 0})`}
                  </span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Vecinos, miren este pedido de obra en ${selectedPin.calle} (${selectedPin.localidad}): "${selectedPin.titulo}". Coordinación: Juan Pedro Aquino - LLA Brown. Ver en: https://llabrown.com.ar`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compartir con Vecinos</span>
                </a>
              </div>
            </div>
          ) : !selectedBarrioInfo && !selectedCircuitoInfo && (
            <div className="glass-panel rounded-3xl p-8 border border-purple-500/30 text-center flex flex-col items-center justify-center min-h-[420px]">
              <MapPin className="w-10 h-10 text-amber-400 mb-3 animate-bounce" />
              <h4 className="text-base font-bold text-white mb-1">
                Explorá el Mapa de Almirante Brown
              </h4>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed mb-4">
                Hacé click en cualquiera de los pines de obras para ver fotos y descargar el proyecto en PDF, o explorá los 155 barrios (Ord. 13.906) y 11 circuitos electorales.
              </p>
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-900/50 text-left text-xs text-slate-300 w-full max-w-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Opciones de Cartografía</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Cambiá el estilo entre <strong>ESRI Calles</strong>, <strong>CARTO Obsidiana</strong> o <strong>CARTO Voyager</strong> con el selector superior.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
