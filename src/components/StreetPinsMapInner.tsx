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
  BarrioProperties,
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
  Compass,
  Check,
  MessageCircle,
  Vote,
  School,
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

  const [basemapStyle, setBasemapStyle] = useState<BasemapKey>('esri');

  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [selectedLocalidad, setSelectedLocalidad] = useState<string>('Todas');
  const [selectedBarrioFilter, setSelectedBarrioFilter] = useState<string>('Todos');

  const [showPinsLayer, setShowPinsLayer] = useState<boolean>(true);
  const [showBarriosLayer, setShowBarriosLayer] = useState<boolean>(true);
  const [showCircuitosLayer, setShowCircuitosLayer] = useState<boolean>(false);

  const [barriosGeoJSON, setBarriosGeoJSON] = useState<any | null>(null);
  const [circuitosGeoJSON, setCircuitosGeoJSON] = useState<any | null>(null);
  const [callesData, setCallesData] = useState<StreetItem[]>([]);

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

  const pinCountByLocalidad = useMemo(() => {
    const counts: Record<string, number> = {};
    pins.forEach((p) => {
      counts[p.localidad] = (counts[p.localidad] || 0) + 1;
    });
    return counts;
  }, [pins]);

  const barriosOfSelectedLocalidad: BarrioProperties[] = useMemo(() => {
    if (!barriosGeoJSON?.features) return [];
    if (selectedLocalidad === 'Todas') {
      return barriosGeoJSON.features.map((f: any) => f.properties as BarrioProperties);
    }
    return barriosGeoJSON.features
      .map((f: any) => f.properties as BarrioProperties)
      .filter((p: BarrioProperties) => p.localidad.toLowerCase() === selectedLocalidad.toLowerCase());
  }, [barriosGeoJSON, selectedLocalidad]);

  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const results = searchBrownTerritory(searchQuery, callesData, barriosGeoJSON);
    setSearchResults(results);
  }, [searchQuery, callesData, barriosGeoJSON]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

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

    const initialConfig = BASEMAP_STYLES.esri;
    const tileLayer = L.tileLayer(initialConfig.url, {
      attribution: initialConfig.attribution,
      maxZoom: initialConfig.maxZoom,
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    fetch('/data/almirante-brown-rings.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((rings: [number, number][][]) => {
        if (!rings || !Array.isArray(rings) || !mapInstanceRef.current) return;
        const outerWorld: [number, number][] = [
          [-90, -180],
          [-90, 180],
          [90, 180],
          [90, -180],
        ];

        L.polygon([outerWorld, ...rings], {
          fillColor: '#1f0d3d',
          fillOpacity: 0.85,
          stroke: false,
          interactive: false,
        }).addTo(mapInstanceRef.current);

        rings.forEach((ring) => {
          L.polyline(ring, {
            color: '#6c4c99',
            weight: 2.2,
            opacity: 0.9,
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

  useEffect(() => {
    if (!tileLayerRef.current) return;
    const cfg = BASEMAP_STYLES[basemapStyle];
    tileLayerRef.current.setUrl(cfg.url);
  }, [basemapStyle]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (circuitosLayerRef.current) {
      circuitosLayerRef.current.remove();
      circuitosLayerRef.current = null;
    }

    if (showCircuitosLayer && circuitosGeoJSON) {
      circuitosLayerRef.current = L.geoJSON(circuitosGeoJSON, {
        style: {
          color: '#39b5e6',
          weight: 2,
          opacity: 0.8,
          dashArray: '5, 6',
          fillColor: '#0284c7',
          fillOpacity: 0.12,
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties as CircuitoProperties;
          layer.bindTooltip(`<strong>Circuito ${p.circuitoCode || p.circuito || ''}</strong><br/>${p.nombre || ''}`, {
            direction: 'center',
            className: 'custom-leaflet-tooltip',
          });

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({ weight: 3.5, opacity: 1, fillOpacity: 0.3, color: '#39b5e6' });
              l.bringToFront();
            },
            mouseout: (e) => {
              const l = e.target;
              l.setStyle({ weight: 2, opacity: 0.8, fillOpacity: 0.12, color: '#39b5e6' });
            },
            click: (e) => {
              L.DomEvent.stopPropagation(e);
              setSelectedCircuitoInfo(p);
              setSelectedBarrioInfo(null);
              setSelectedPin(null);
            },
          });
        },
      }).addTo(mapInstanceRef.current);
    }
  }, [showCircuitosLayer, circuitosGeoJSON]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (barriosLayerRef.current) {
      barriosLayerRef.current.remove();
      barriosLayerRef.current = null;
    }

    if (showBarriosLayer && barriosGeoJSON) {
      barriosLayerRef.current = L.geoJSON(barriosGeoJSON, {
        style: (feature) => {
          const color = feature?.properties?.color || '#6c4c99';
          return {
            color: color,
            weight: 1.2,
            opacity: 0.65,
            fillColor: color,
            fillOpacity: 0.14,
            dashArray: '2, 3',
          };
        },
        onEachFeature: (feature, layer) => {
          const p = feature.properties as BarrioProperties;
          layer.bindTooltip(
            `<strong>${p.nombre}</strong><br/><span style="opacity:0.85;font-size:10px;">${p.localidad} (Ord. 13.906)</span>`,
            {
              sticky: true,
              className: 'custom-leaflet-tooltip',
            }
          );

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({
                weight: 2.8,
                opacity: 1,
                fillOpacity: 0.35,
                color: '#371859',
              });
              l.bringToFront();
            },
            mouseout: (e) => {
              const l = e.target;
              const color = feature?.properties?.color || '#6c4c99';
              l.setStyle({
                color: color,
                weight: 1.2,
                opacity: 0.65,
                fillOpacity: 0.14,
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
            },
          });
        },
      }).addTo(mapInstanceRef.current);
    }
  }, [showBarriosLayer, barriosGeoJSON]);

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
      let color = '#371859'; // Violeta Oficial LLA (Pantone 2627 C)
      let iconSvg = '<path d="M4 14h8M5 14l2-8h2l2 8M7 9h2" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/>';
      if (pin.categoria.includes('Seguridad')) {
        color = '#0284c7'; // Celeste LLA
        iconSvg = '<path d="M8 2l5 2.5v4c0 3.5-2.2 6.5-5 7.5-2.8-1-5-4-5-7.5v-4L8 2z" stroke="#ffffff" stroke-width="1.5" fill="none"/>';
      } else if (pin.categoria.includes('Ordenanza') || pin.categoria.includes('HCD')) {
        color = '#230552'; // Violeta Profundo LLA
        iconSvg = '<path d="M2 14h12M4 14V6M8 14V6M12 14V6M2 6h12M8 2L2 6h12L8 2z" stroke="#ffffff" stroke-width="1.4" fill="none"/>';
      } else if (pin.categoria.includes('Visita')) {
        color = '#6c4c99'; // Violeta Suave LLA
        iconSvg = '<path d="M8 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14a5 5 0 0110 0H3z" stroke="#ffffff" stroke-width="1.5" fill="none"/>';
      } else if (pin.categoria.includes('Salud')) {
        color = '#b23c8e'; // Magenta-Violeta LLA Nacional
        iconSvg = '<path d="M8 4v8M4 8h8" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round"/>';
      } else if (pin.categoria.includes('Medio Ambiente')) {
        color = '#39b5e6'; // Celeste LLA Nacional
        iconSvg = '<path d="M4 12c0-4 4-8 8-8 0 4-4 8-8 8zm0 0l4-4" stroke="#ffffff" stroke-width="1.6" fill="none"/>';
      }

      const icon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.4));">
            <svg width="30" height="38" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 0C7.16 0 0 7.16 0 16c0 10.5 14.8 23.3 15.4 23.8.4.3.9.3 1.2 0C17.2 39.3 32 26.5 32 16c0-8.84-7.16-16-16-16z" fill="${color}"/>
              <path d="M16 1C7.72 1 1 7.72 1 16c0 9.8 14.2 22.3 15 23 0.8-.7 15-13.2 15-23C31 7.72 24.28 1 16 1z" stroke="#ffffff" stroke-width="1.5" stroke-opacity="0.9"/>
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
      setSelectedPin((prev) => (prev ? { ...prev, apoyosVecinales: (prev.apoyosVecinales || 0) + 1 } : null));
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
            <div style="position:absolute; width:100%; height:100%; border-radius:50%; background:#39b5e6; opacity:0.75; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute; top:6px; left:6px; width:24px; height:24px; border-radius:50%; background:#371859; border:2px solid #ffffff; display:flex; align-items:center; justify-content:center; color:white; font-size:12px; font-weight:bold;">•</div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
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
    'Medio Ambiente / Basurales',
  ];

  const pinsInSelectedBarrio = useMemo(() => {
    if (!selectedBarrioInfo) return [];
    return pins.filter((p) => {
      if (p.barrio && p.barrio.toLowerCase() === selectedBarrioInfo.nombre.toLowerCase()) return true;
      if (barriosGeoJSON) {
        const detected = detectBarrio(p.lat, p.lng, barriosGeoJSON);
        return detected?.nombre.toLowerCase() === selectedBarrioInfo.nombre.toLowerCase();
      }
      return false;
    });
  }, [pins, selectedBarrioInfo, barriosGeoJSON]);

  const pinsInSelectedCircuito = useMemo(() => {
    if (!selectedCircuitoInfo || !selectedCircuitoInfo.localidadesPrincipales) return [];
    const locs = selectedCircuitoInfo.localidadesPrincipales.map((l) => l.toLowerCase());
    return pins.filter((p) => locs.includes(p.localidad.toLowerCase()));
  }, [pins, selectedCircuitoInfo]);

  return (
    <div className="flex flex-col gap-4">
      {/* Barra superior: Búsqueda instantánea, Estilo y Capas */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-lg">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#371859] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              placeholder="Buscar entre 1.484 calles y 176 barrios oficiales de Brown..."
              className="w-full pl-10 pr-9 py-2 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                  setIsSearching(false);
                }}
                className="absolute right-3 text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100">
              <div className="p-2.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Resultados en Almirante Brown</span>
                <span className="text-[#371859]">{searchResults.length} encontrados</span>
              </div>
              <div className="max-h-60 overflow-y-auto">
                {searchResults.map((res, i) => (
                  <button
                    key={`${res.title}-${i}`}
                    onClick={() => handleSelectSearchResult(res)}
                    className="w-full px-3.5 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          res.type === 'barrio' ? 'bg-[#371859]' : 'bg-[#39b5e6]'
                        }`}
                      />
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 block truncate">{res.title}</span>
                        <span className="text-[10px] text-slate-500 truncate">{res.subtitle}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        res.type === 'barrio'
                          ? 'bg-purple-50 text-[#371859] border border-purple-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}
                    >
                      {res.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de mapa base */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-500 px-1.5 hidden sm:inline">
              Vista:
            </span>
            {(['esri', 'carto-dark', 'carto-voyager'] as BasemapKey[]).map((key) => {
              const cfg = BASEMAP_STYLES[key];
              const isActive = basemapStyle === key;
              return (
                <button
                  key={key}
                  onClick={() => setBasemapStyle(key)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                    isActive
                      ? 'bg-[#371859] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                  title={`Seleccionar ${cfg.name}`}
                >
                  {cfg.name}
                </button>
              );
            })}
          </div>

          {/* Capas del mapa */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowPinsLayer(!showPinsLayer)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showPinsLayer
                  ? 'bg-[#371859] text-white font-bold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Pines</span>
              {showPinsLayer && <Check className="w-3 h-3 stroke-[3]" />}
            </button>

            <button
              onClick={() => setShowBarriosLayer(!showBarriosLayer)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showBarriosLayer
                  ? 'bg-[#6c4c99] text-white font-bold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
              title="Límites oficiales de los 176 barrios según Ordenanza N° 13.906 de Almirante Brown"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Barrios (176)</span>
              {showBarriosLayer && <Check className="w-3 h-3 stroke-[3]" />}
            </button>

            <button
              onClick={() => setShowCircuitosLayer(!showCircuitosLayer)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showCircuitosLayer
                  ? 'bg-[#0284c7] text-white font-bold shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
              }`}
              title="Superponer los 11 circuitos electorales oficiales"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Circuitos</span>
              {showCircuitosLayer && <Check className="w-3 h-3 stroke-[3]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Filtro por categoría */}
      <div className="flex flex-wrap items-center gap-1.5 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-[#371859]" />
          Tema:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategoria(cat)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
              selectedCategoria === cat
                ? 'bg-[#371859] text-white font-bold'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Filtro rápido por localidad */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#371859] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Localidades de Almirante Brown:
          </span>

          {selectedLocalidad !== 'Todas' && barriosOfSelectedLocalidad.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-600 text-[11px] font-semibold">Barrio:</span>
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
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 text-xs focus:outline-none focus:border-[#371859]"
              >
                <option value="Todos">
                  Todos los barrios de {selectedLocalidad} ({barriosOfSelectedLocalidad.length})
                </option>
                {barriosOfSelectedLocalidad.map((b) => (
                  <option key={b.nombre} value={b.nombre}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => {
              setSelectedLocalidad('Todas');
              setSelectedBarrioFilter('Todos');
              if (mapInstanceRef.current) mapInstanceRef.current.flyTo([-34.825, -58.380], 12.5);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedLocalidad === 'Todas'
                ? 'bg-[#371859] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>Todas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedLocalidad === 'Todas' ? 'bg-white/20 text-white' : 'bg-white text-[#371859]'
              }`}
            >
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
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#371859] text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{l.nombre}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-white text-[#371859]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mapa principal + Panel lateral de ficha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lienzo del Mapa (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm relative">
          <div className="flex items-center justify-between mb-3 px-1 gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#371859]" />
              Pines Territoriales, Barrios & Circuitos de Brown
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-[#371859] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200 hidden sm:inline">
                {pins.length} Reclamos y Obras · 176 Barrios
              </span>
              <a
                href="#reclamos"
                className="px-3 py-1.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Send className="w-3 h-3" />
                <span>Cargar Reclamo</span>
              </a>
            </div>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[540px] rounded-xl overflow-hidden border border-slate-200 z-0"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-500 px-1 gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#371859]" /> Calles / Asfalto
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]" /> Seguridad
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#230552]" /> HCD
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#6c4c99]" /> Visitas
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#b23c8e]" /> Salud
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#39b5e6]" /> Circuito / Ambiente
              </span>
            </div>
            <span className="text-[#371859] font-semibold">
              Hacé clic en un pin, barrio o circuito para ver su ficha
            </span>
          </div>
        </div>

        {/* Panel de detalle lateral (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 1. Ficha de Circuito Electoral */}
          {selectedCircuitoInfo && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative animate-fadeIn">
              <button
                onClick={() => setSelectedCircuitoInfo(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2 pr-6">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[11px] font-bold border border-sky-200">
                  Circuito {selectedCircuitoInfo.circuitoCode || selectedCircuitoInfo.circuito}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-[#371859] text-[10px] font-semibold border border-purple-200">
                  Sección 3ra PBA
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                {selectedCircuitoInfo.nombre}
              </h3>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                {selectedCircuitoInfo.descripcion || 'Zona electoral y territorial de Almirante Brown.'}
              </p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <Vote className="w-4 h-4 text-[#371859] mx-auto mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Electores</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {selectedCircuitoInfo.electores
                      ? selectedCircuitoInfo.electores.toLocaleString('es-AR')
                      : '28.000+'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <School className="w-4 h-4 text-[#0284c7] mx-auto mb-1" />
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Escuelas</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {selectedCircuitoInfo.establecimientosCount || 15} centros
                  </span>
                </div>
              </div>

              {selectedCircuitoInfo.localidadesPrincipales && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1.5">
                    Localidades comprendidas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCircuitoInfo.localidadesPrincipales.map((loc) => (
                      <span
                        key={loc}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 font-semibold text-[11px]"
                      >
                        {loc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs">
                <span className="text-[10px] font-bold uppercase text-[#371859] block mb-1">
                  Reclamos & Obras en esta zona: {pinsInSelectedCircuito.length}
                </span>
                {pinsInSelectedCircuito.length > 0 ? (
                  <div className="space-y-1.5 mt-1.5">
                    {pinsInSelectedCircuito.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedPin(p);
                          setSelectedCircuitoInfo(null);
                        }}
                        className="w-full text-left p-2 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 text-xs text-slate-800 font-medium truncate block transition-colors"
                      >
                        • {p.titulo}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-500 text-[11px]">No hay reclamos cargados para este circuito.</span>
                )}
              </div>

              {selectedCircuitoInfo.wa && (
                <a
                  href={selectedCircuitoInfo.wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Contactar Referente del Circuito</span>
                </a>
              )}
            </div>
          )}

          {/* 2. Ficha de Barrio Oficial */}
          {selectedBarrioInfo && !selectedPin && !selectedCircuitoInfo && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative animate-fadeIn">
              <button
                onClick={() => setSelectedBarrioInfo(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 mb-2 pr-6">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-[#371859] text-[11px] font-bold border border-purple-200">
                  {selectedBarrioInfo.localidad}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                  {selectedBarrioInfo.anexo}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-slate-900 mb-1">
                {selectedBarrioInfo.nombre}
              </h3>
              <p className="text-xs text-[#6c4c99] font-medium mb-4">
                Subdivisión barrial oficial según Ordenanza N° 13.906 del HCD de Almirante Brown.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-slate-700 font-semibold">Pines activos en este barrio:</span>
                  <span className="text-xs font-extrabold text-[#371859] px-2 py-0.5 rounded-full bg-purple-100">
                    {pinsInSelectedBarrio.length}
                  </span>
                </div>
                {pinsInSelectedBarrio.length > 0 ? (
                  <div className="mt-2 space-y-1.5">
                    {pinsInSelectedBarrio.slice(0, 3).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPin(p)}
                        className="w-full text-left p-2 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 text-xs text-slate-800 font-medium transition-colors truncate block"
                      >
                        • {p.titulo}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Aún no hay reclamos cargados en este barrio. Podés comunicarte con tu referente de{' '}
                    {selectedBarrioInfo.localidad}.
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedLocalidad(selectedBarrioInfo.localidad as LocalidadNombre);
                  setSelectedBarrioFilter(selectedBarrioInfo.nombre);
                }}
                className="w-full py-2.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Filtrar mapa a este barrio
              </button>
            </div>
          )}

          {/* 3. Ficha de Pin seleccionado */}
          {selectedPin ? (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative animate-fadeIn flex flex-col justify-between">
              <button
                onClick={() => setSelectedPin(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-3 pr-8">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[#371859] text-[11px] font-bold">
                    {selectedPin.categoria}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold border border-slate-200">
                    {selectedPin.estado}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-900 mb-2 leading-snug">
                  {selectedPin.titulo}
                </h3>

                <div className="flex flex-col gap-1 text-xs mb-3">
                  <div className="flex items-center gap-1.5 text-[#371859] font-semibold">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {selectedPin.calle} · {selectedPin.localidad}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 text-[11px] font-medium ml-5">
                    <span>
                      Barrio:{' '}
                      <strong>
                        {selectedPin.barrio ||
                          (barriosGeoJSON
                            ? detectBarrio(selectedPin.lat, selectedPin.lng, barriosGeoJSON)?.nombre
                            : 'Sin especificar')}
                      </strong>{' '}
                      (Ord. 13.906)
                    </span>
                  </div>
                </div>

                {selectedPin.fotos && selectedPin.fotos.length > 0 && (
                  <div className="relative w-full h-44 rounded-xl overflow-hidden mb-4 border border-slate-200">
                    <Image
                      src={selectedPin.fotos[0]}
                      alt={selectedPin.titulo}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {selectedPin.descripcion}
                </p>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4 text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Concejal Responsable / Autor:
                  </span>
                  <span className="text-slate-900 font-bold block mt-0.5">
                    {selectedPin.concejal}
                  </span>
                </div>

                {selectedPin.pdfUrl && (
                  <a
                    href={selectedPin.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-3 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#371859] font-bold text-xs flex items-center justify-between mb-4 transition-colors"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-[#371859] shrink-0" />
                      <span className="truncate">{selectedPin.pdfNombre || 'Proyecto de Ordenanza (PDF)'}</span>
                    </span>
                    <Download className="w-4 h-4 shrink-0" />
                  </a>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-2">
                <button
                  onClick={() => handleSupport(selectedPin.id)}
                  disabled={supportedPins[selectedPin.id]}
                  className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
                    supportedPins[selectedPin.id]
                      ? 'bg-purple-50 border border-purple-200 text-[#371859] cursor-default'
                      : 'bg-[#371859] hover:bg-[#230552] text-white'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>
                    {supportedPins[selectedPin.id]
                      ? '¡Apoyo Registrado!'
                      : `Apoyar este Pedido (${selectedPin.apoyosVecinales || 0})`}
                  </span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    `Vecinos, miren este pedido de obra en ${selectedPin.calle} (${selectedPin.localidad}): "${selectedPin.titulo}". Coordinación: Juan Pedro Aquino - LLA Brown. Ver en: https://llabrown.com.ar`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Compartir con Vecinos</span>
                </a>
              </div>
            </div>
          ) : (
            !selectedBarrioInfo &&
            !selectedCircuitoInfo && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center min-h-[420px]">
                <div className="w-12 h-12 rounded-full bg-purple-50 text-[#371859] flex items-center justify-center mb-3">
                  <MapPin className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">
                  Explorá el Mapa de Almirante Brown
                </h4>
                <p className="text-xs text-slate-600 max-w-xs leading-relaxed mb-5">
                  Hacé clic en cualquiera de los pines de obras para ver fotos y descargar el proyecto en PDF, o explorá los 176 barrios (Ord. 13.906) y los 11 circuitos electorales.
                </p>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 w-full max-w-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-[#371859] font-bold text-[11px]">
                    <Compass className="w-3.5 h-3.5" />
                    <span>Opciones de Cartografía</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Elegí la vista entre <strong>ESRI Calles</strong>, <strong>CARTO Obsidiana</strong> o{' '}
                    <strong>CARTO Voyager</strong> desde la barra superior.
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
