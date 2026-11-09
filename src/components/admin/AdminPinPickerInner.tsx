'use client';

import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PinTerritorial, PinCategoria, PinEstado, LocalidadNombre } from '@/types';
import { LOCALIDADES, CONCEJALES } from '@/data/mockData';
import {
  detectBarrio,
  searchBrownTerritory,
  SearchResult,
  StreetItem,
  BarrioProperties,
} from '@/lib/geoUtils';
import {
  PlusCircle,
  Trash2,
  Upload,
  FileText,
  Building2,
  Search,
  X,
} from 'lucide-react';

const CARTO_KEY = 'cb1_4gpl_1_91252c0c164ed9fcbdef50a7';

const ADMIN_BASEMAPS = {
  esri: {
    name: 'ESRI Calles',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Map &copy; Esri &mdash; Almirante Brown',
    maxZoom: 19,
  },
  'carto-dark': {
    name: 'CARTO Obsidiana',
    url: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 20,
    subdomains: 'abcd',
  },
  'carto-voyager': {
    name: 'CARTO Voyager',
    url: `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
    attribution: '&copy; CARTO &copy; OpenStreetMap',
    maxZoom: 20,
    subdomains: 'abcd',
  },
};

type AdminBasemapKey = keyof typeof ADMIN_BASEMAPS;

export default function AdminPinPickerInner() {
  const [pines, setPines] = useState<PinTerritorial[]>([]);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: -34.825,
    lng: -58.385,
  });

  const [basemapStyle, setBasemapStyle] = useState<AdminBasemapKey>('esri');

  const [titulo, setTitulo] = useState('');
  const [calle, setCalle] = useState('');
  const [localidad, setLocalidad] = useState<LocalidadNombre>('Burzaco');
  const [barrio, setBarrio] = useState<string>('');
  const [categoria, setCategoria] = useState<PinCategoria>('Arreglo de Calles / Asfalto');
  const [estado, setEstado] = useState<PinEstado>('Proyecto Presentado en HCD');
  const [concejal, setConcejal] = useState('Juan Pedro Aquino');
  const [descripcion, setDescripcion] = useState('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [pdfNombre, setPdfNombre] = useState('');

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const [barriosGeoJSON, setBarriosGeoJSON] = useState<any | null>(null);
  const [callesData, setCallesData] = useState<StreetItem[]>([]);
  const [detectedBarrioInfo, setDetectedBarrioInfo] = useState<BarrioProperties | null>(null);

  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminSearchResults, setAdminSearchResults] = useState<SearchResult[]>([]);
  const [isAdminSearching, setIsAdminSearching] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const tempMarkerRef = useRef<L.Marker | null>(null);
  const existingPinsLayerRef = useRef<L.LayerGroup | null>(null);

  const loadPines = () => {
    fetch('/api/pines')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setPines(data);
      })
      .catch((e) => console.warn('Error loading pins:', e));
  };

  useEffect(() => {
    loadPines();

    fetch('/data/almirante-brown-barrios.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setBarriosGeoJSON(d))
      .catch((e) => console.warn('Error loading barrios in admin:', e));

    fetch('/data/almirante-brown-calles.json')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setCallesData(Array.isArray(d) ? d : []))
      .catch((e) => console.warn('Error loading calles in admin:', e));
  }, []);

  useEffect(() => {
    if (!barriosGeoJSON) return;
    const detected = detectBarrio(selectedCoords.lat, selectedCoords.lng, barriosGeoJSON);
    if (detected) {
      setDetectedBarrioInfo(detected);
      setBarrio(detected.nombre);
      const matchLoc = LOCALIDADES.find((l) => l.nombre.toLowerCase() === detected.localidad.toLowerCase());
      if (matchLoc) {
        setLocalidad(matchLoc.nombre);
      }
    } else {
      setDetectedBarrioInfo(null);
    }
  }, [selectedCoords, barriosGeoJSON]);

  useEffect(() => {
    if (!adminSearchQuery.trim() || adminSearchQuery.trim().length < 2) {
      setAdminSearchResults([]);
      return;
    }
    const results = searchBrownTerritory(adminSearchQuery, callesData, barriosGeoJSON);
    setAdminSearchResults(results);
  }, [adminSearchQuery, callesData, barriosGeoJSON]);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const southWest = L.latLng(-34.918, -58.455);
    const northEast = L.latLng(-34.748, -58.285);
    const brownBounds = L.latLngBounds(southWest, northEast);

    const map = L.map(mapContainerRef.current, {
      center: [-34.825, -58.380],
      zoom: 13,
      minZoom: 12,
      maxZoom: 18,
      maxBounds: brownBounds,
      maxBoundsViscosity: 1.0,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialCfg = ADMIN_BASEMAPS.esri;
    const tileLayer = L.tileLayer(initialCfg.url, {
      attribution: initialCfg.attribution,
      maxZoom: initialCfg.maxZoom,
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
          fillOpacity: 0.88,
          stroke: false,
          interactive: false,
        }).addTo(mapInstanceRef.current);

        rings.forEach((ring) => {
          L.polyline(ring, {
            color: '#6c4c99',
            weight: 2,
            opacity: 0.85,
            interactive: false,
          }).addTo(mapInstanceRef.current!);
        });
      })
      .catch((e) => console.warn('Could not load mask rings in admin:', e));

    fetch('/data/almirante-brown-barrios.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((barriosData) => {
        if (barriosData && mapInstanceRef.current) {
          L.geoJSON(barriosData, {
            style: (f) => ({
              color: f?.properties?.color || '#6c4c99',
              weight: 1,
              opacity: 0.5,
              fillOpacity: 0.08,
              dashArray: '3, 4',
            }),
            interactive: false,
          }).addTo(mapInstanceRef.current);
        }
      })
      .catch((e) => console.warn('Could not load barrios overlay in admin:', e));

    const pinIcon = L.divIcon({
      className: 'admin-temp-pin',
      html: `
        <div style="filter: drop-shadow(0 4px 10px rgba(0,0,0,0.6)); cursor: grab;">
          <svg width="36" height="44" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16c0 10.5 14.8 23.3 15.4 23.8.4.3.9.3 1.2 0C17.2 39.3 32 26.5 32 16c0-8.84-7.16-16-16-16z" fill="#39b5e6"/>
            <path d="M16 1C7.72 1 1 7.72 1 16c0 9.8 14.2 22.3 15 23 0.8-.7 15-13.2 15-23C31 7.72 24.28 1 16 1z" stroke="#ffffff" stroke-width="2"/>
            <circle cx="16" cy="15" r="5" fill="#371859"/>
          </svg>
        </div>
      `,
      iconSize: [36, 44],
      iconAnchor: [18, 44],
    });

    const marker = L.marker([-34.825, -58.385], { icon: pinIcon, draggable: true }).addTo(map);
    tempMarkerRef.current = marker;

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      setSelectedCoords({ lat: Number(pos.lat.toFixed(5)), lng: Number(pos.lng.toFixed(5)) });
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      setSelectedCoords({ lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) });
      marker.setLatLng([lat, lng]);
    });

    existingPinsLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!tileLayerRef.current) return;
    const cfg = ADMIN_BASEMAPS[basemapStyle];
    tileLayerRef.current.setUrl(cfg.url);
  }, [basemapStyle]);

  useEffect(() => {
    if (!existingPinsLayerRef.current) return;
    existingPinsLayerRef.current.clearLayers();

    pines.forEach((p) => {
      const icon = L.divIcon({
        className: 'admin-existing-pin',
        html: `
          <div style="cursor: pointer; opacity: 0.8; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">
            <svg width="22" height="28" viewBox="0 0 32 40" fill="none">
              <path d="M16 0C7.16 0 0 7.16 0 16c0 10.5 14.8 23.3 15.4 23.8.4.3.9.3 1.2 0C17.2 39.3 32 26.5 32 16c0-8.84-7.16-16-16-16z" fill="#371859"/>
              <path d="M16 1C7.72 1 1 7.72 1 16c0 9.8 14.2 22.3 15 23 0.8-.7 15-13.2 15-23C31 7.72 24.28 1 16 1z" stroke="#ffffff" stroke-width="1.5"/>
            </svg>
          </div>
        `,
        iconSize: [22, 28],
        iconAnchor: [11, 28],
      });

      const m = L.marker([p.lat, p.lng], { icon });
      m.bindTooltip(`<strong>${p.titulo}</strong><br/>${p.calle} (${p.localidad})`, { sticky: true });
      m.addTo(existingPinsLayerRef.current!);
    });
  }, [pines]);

  const handleSelectAdminSearchResult = (res: SearchResult) => {
    if (!mapInstanceRef.current || !tempMarkerRef.current) return;
    setIsAdminSearching(false);
    setAdminSearchQuery('');
    setAdminSearchResults([]);

    mapInstanceRef.current.flyTo([res.lat, res.lng], res.zoom);
    tempMarkerRef.current.setLatLng([res.lat, res.lng]);
    setSelectedCoords({ lat: res.lat, lng: res.lng });

    if (res.type === 'calle' && !calle) {
      setCalle(res.title);
    }
  };

  const handleLocalidadChange = (locNombre: LocalidadNombre) => {
    setLocalidad(locNombre);
    const loc = LOCALIDADES.find((l) => l.nombre === locNombre);
    if (loc && mapInstanceRef.current && tempMarkerRef.current) {
      mapInstanceRef.current.flyTo(loc.coordenadas, 14);
      tempMarkerRef.current.setLatLng(loc.coordenadas);
      setSelectedCoords({ lat: loc.coordenadas[0], lng: loc.coordenadas[1] });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setFotoUrl(data.url);
      } else {
        alert('Error al subir la imagen');
      }
    } catch (err) {
      alert('Error de conexión al subir imagen');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPdf(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setPdfUrl(data.url);
        setPdfNombre(data.originalName || file.name);
      } else {
        alert('Error al subir el archivo PDF');
      }
    } catch (err) {
      alert('Error de conexión al subir PDF');
    } finally {
      setIsUploadingPdf(false);
    }
  };

  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !calle) {
      alert('Por favor completá el título y la calle del reclamo o proyecto.');
      return;
    }

    const newPin: PinTerritorial = {
      id: `pin-${Date.now()}`,
      titulo,
      calle,
      localidad,
      barrio: barrio || undefined,
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      categoria,
      estado,
      concejal,
      descripcion: descripcion || 'Pedido territorial registrado por el bloque de concejales.',
      fotos: fotoUrl ? [fotoUrl] : ['/img/vecinos1.jpeg'],
      pdfUrl: pdfUrl || undefined,
      pdfNombre: pdfNombre || undefined,
      fecha: new Date().toLocaleDateString('es-AR'),
      apoyosVecinales: 1,
    };

    try {
      const res = await fetch('/api/pines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPin),
      });

      if (res.ok) {
        alert('¡Pin territorial guardado exitosamente en PostgreSQL!');
        setTitulo('');
        setCalle('');
        setDescripcion('');
        setFotoUrl('');
        setPdfUrl('');
        setPdfNombre('');
        loadPines();
      } else {
        alert('Hubo un error al guardar el pin.');
      }
    } catch (err) {
      alert('Error de conexión al guardar.');
    }
  };

  const handleDeletePin = async (id: string) => {
    if (!confirm('¿Seguro que deseás eliminar este pin territorial?')) return;
    try {
      const res = await fetch(`/api/pines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPines((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (e) {
      alert('Error al eliminar pin.');
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Buscador Rápido de Calles y Barrios para Concejales */}
      <div className="glass-panel p-4 rounded-3xl border border-purple-500/40 relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#39b5e6] animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Buscador Rápido de Calles y Barrios para Concejales
            </h3>
          </div>
          <span className="text-xs text-purple-300">
            Escribí la calle o barrio y el mapa se posicionará de inmediato
          </span>
        </div>

        <div className="relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#39b5e6] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={adminSearchQuery}
              onChange={(e) => {
                setAdminSearchQuery(e.target.value);
                setIsAdminSearching(true);
              }}
              onFocus={() => setIsAdminSearching(true)}
              placeholder="Ej: Amenedo, Alsina, Salta, Bynnon, Corimayo, Don Orione..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-purple-950/80 border border-purple-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#39b5e6]"
            />
            {adminSearchQuery && (
              <button
                onClick={() => {
                  setAdminSearchQuery('');
                  setAdminSearchResults([]);
                  setIsAdminSearching(false);
                }}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {isAdminSearching && adminSearchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#120722] border border-purple-600/60 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-purple-900/50 backdrop-blur-md">
              <div className="p-2 bg-purple-950/70 text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Calles y Barrios encontrados</span>
                <span className="text-[#39b5e6]">{adminSearchResults.length} sugerencias</span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {adminSearchResults.map((res, i) => (
                  <button
                    key={`${res.title}-${i}`}
                    onClick={() => handleSelectAdminSearchResult(res)}
                    className="w-full px-3.5 py-2 text-left hover:bg-purple-900/50 flex items-center justify-between gap-2 transition-colors"
                  >
                    <div className="truncate">
                      <span className="text-xs font-bold text-white block truncate">{res.title}</span>
                      <span className="text-[10px] text-slate-300 truncate">{res.subtitle}</span>
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                      Ubicar aquí
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Mapa (6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-5 border border-purple-500/30 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between pb-2 border-b border-purple-900/40 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#39b5e6]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                1. Posicioná el Pin en la Calle
              </h3>
            </div>

            <div className="flex items-center gap-1 bg-purple-950/80 p-1 rounded-xl border border-purple-800/80">
              {(['esri', 'carto-dark', 'carto-voyager'] as AdminBasemapKey[]).map((key) => {
                const cfg = ADMIN_BASEMAPS[key];
                const isActive = basemapStyle === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBasemapStyle(key)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                      isActive
                        ? 'bg-[#371859] text-white border border-purple-400/50 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-purple-900/50'
                    }`}
                  >
                    {cfg.name}
                  </button>
                );
              })}
            </div>
          </div>

          {detectedBarrioInfo ? (
            <div className="p-3 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-between text-xs animate-fadeIn">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-[#39b5e6] shrink-0" />
                <span className="truncate text-slate-200">
                  Detectado: <strong>Barrio {detectedBarrioInfo.nombre}</strong> ({detectedBarrioInfo.localidad})
                </span>
              </div>
              <span className="text-[10px] font-bold text-purple-300 bg-purple-900/60 px-2 py-0.5 rounded-full shrink-0">
                {detectedBarrioInfo.anexo}
              </span>
            </div>
          ) : (
            <p className="text-xs text-slate-300">
              Hacé clic o arrastrá el marcador celeste a cualquier punto de Almirante Brown:
            </p>
          )}

          <div
            ref={mapContainerRef}
            className="w-full h-[420px] rounded-2xl overflow-hidden border border-purple-900/60 z-0"
          />

          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Arrastrá el marcador para ajustar la posición</span>
            <span className="text-purple-300">Líneas punteadas: Límites de barrios</span>
          </div>
        </div>

        {/* Columna Formulario (6 cols) */}
        <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-900/40">
            <PlusCircle className="w-5 h-5 text-[#39b5e6]" />
            <h3 className="text-base font-bold text-white">
              2. Completá los Datos del Reclamo o Proyecto
            </h3>
          </div>

          <form onSubmit={handleCreatePin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Título del Reclamo / Obra *
              </label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej: Pedido de Asfalto y Cordón Cuneta en Calle Salta"
                className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Calle y Altura / Esquina *
                </label>
                <input
                  type="text"
                  required
                  value={calle}
                  onChange={(e) => setCalle(e.target.value)}
                  placeholder="Ej: Calle Salta y Bynnon"
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Localidad *
                </label>
                <select
                  value={localidad}
                  onChange={(e) => handleLocalidadChange(e.target.value as LocalidadNombre)}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                >
                  {LOCALIDADES.map((l) => (
                    <option key={l.id} value={l.nombre} className="bg-[#140b24]">
                      {l.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Barrio (Ordenanza N° 13.906)
              </label>
              <input
                type="text"
                value={barrio}
                onChange={(e) => setBarrio(e.target.value)}
                placeholder="Se auto-detecta al mover el pin en el mapa"
                className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-[#39b5e6] font-semibold focus:outline-none focus:border-[#39b5e6]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Categoría *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as PinCategoria)}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                >
                  <option value="Arreglo de Calles / Asfalto" className="bg-[#140b24]">
                    Arreglo de Calles / Asfalto
                  </option>
                  <option value="Seguridad / Luminarias" className="bg-[#140b24]">
                    Seguridad / Luminarias
                  </option>
                  <option value="Proyecto de Ordenanza HCD" className="bg-[#140b24]">
                    Proyecto de Ordenanza HCD
                  </option>
                  <option value="Visita Vecinal / Reclamo" className="bg-[#140b24]">
                    Visita Vecinal / Reclamo
                  </option>
                  <option value="Salud / CAPS" className="bg-[#140b24]">
                    Salud / CAPS
                  </option>
                  <option value="Medio Ambiente / Basurales" className="bg-[#140b24]">
                    Medio Ambiente / Basurales
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estado *
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as PinEstado)}
                  className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                >
                  <option value="Reclamo Vecinal Recibido" className="bg-[#140b24]">
                    Reclamo Vecinal Recibido
                  </option>
                  <option value="Proyecto Presentado en HCD" className="bg-[#140b24]">
                    Proyecto Presentado en HCD
                  </option>
                  <option value="En Gestión / Comisión" className="bg-[#140b24]">
                    En Gestión / Comisión
                  </option>
                  <option value="Resuelto / Completado" className="bg-[#140b24]">
                    Resuelto / Completado
                  </option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Concejal Responsable / Autor
              </label>
              <select
                value={concejal}
                onChange={(e) => setConcejal(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
              >
                {CONCEJALES.map((c) => (
                  <option key={c.id} value={c.nombre} className="bg-[#140b24]">
                    {c.nombre}
                  </option>
                ))}
                <option value="Bloque LLA Almirante Brown" className="bg-[#140b24]">
                  Bloque LLA Almirante Brown
                </option>
              </select>
            </div>

            {/* Subir Foto */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Foto del Lugar / Bache / Actividad
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 px-3 py-2 rounded-xl bg-purple-950/80 border border-purple-800 hover:border-[#39b5e6] cursor-pointer flex items-center justify-center gap-2 text-xs text-purple-200 transition-all">
                  <Upload className="w-4 h-4 text-[#39b5e6]" />
                  <span>
                    {isUploadingPhoto
                      ? 'Subiendo...'
                      : fotoUrl
                      ? 'Foto Cargada ✓'
                      : 'Seleccionar Imagen (JPG/PNG)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                {fotoUrl && (
                  <span className="text-[10px] text-[#39b5e6] font-mono truncate max-w-[150px]">
                    {fotoUrl}
                  </span>
                )}
              </div>
            </div>

            {/* Subir PDF */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Proyecto de Ordenanza / Nota Oficial (PDF)
              </label>
              <div className="flex items-center gap-2">
                <label className="flex-1 px-3 py-2 rounded-xl bg-purple-950/80 border border-purple-800 hover:border-[#39b5e6] cursor-pointer flex items-center justify-center gap-2 text-xs text-purple-200 transition-all">
                  <FileText className="w-4 h-4 text-[#39b5e6]" />
                  <span>
                    {isUploadingPdf
                      ? 'Subiendo PDF...'
                      : pdfUrl
                      ? `PDF: ${pdfNombre} ✓`
                      : 'Adjuntar Documento PDF'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                </label>
                {pdfUrl && (
                  <span className="text-[10px] text-[#39b5e6] font-mono truncate max-w-[150px]">
                    {pdfNombre}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Descripción del Problema o Propuesta *
              </label>
              <textarea
                rows={3}
                required
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle del reclamo vecinal, expediente HCD o informe del estado de la calle..."
                className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-white hover:bg-slate-100 text-[#371859] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Guardar y Publicar Pin en el Mapa</span>
            </button>
          </form>
        </div>
      </div>

      {/* Lista de pines existentes */}
      <div className="glass-panel rounded-3xl p-6 border border-purple-500/30">
        <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Pines Registrados Actualmente ({pines.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {pines.map((pin) => (
            <div
              key={pin.id}
              className="p-3.5 rounded-2xl bg-purple-950/50 border border-purple-900/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-[#39b5e6] px-2 py-0.5 rounded-full bg-sky-500/15">
                    {pin.categoria}
                  </span>
                  <span className="text-[10px] text-slate-400">{pin.fecha}</span>
                </div>
                <h5 className="text-xs font-bold text-white mb-1">{pin.titulo}</h5>
                <p className="text-[11px] text-slate-300 mb-1">
                  {pin.calle} ({pin.localidad}) {pin.barrio ? `· Barrio ${pin.barrio}` : ''}
                </p>
                <p className="text-[10px] text-purple-300">
                  Concejal: {pin.concejal} · {pin.apoyosVecinales || 0} apoyos
                </p>
              </div>

              <div className="pt-2 mt-2 border-t border-purple-900/40 flex items-center justify-between">
                <span className="text-[10px] text-purple-200 font-semibold">{pin.estado}</span>
                <button
                  onClick={() => handleDeletePin(pin.id)}
                  className="p-1 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                  title="Eliminar pin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
