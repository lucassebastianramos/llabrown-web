'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Image from 'next/image';
import { PinTerritorial, LocalidadNombre } from '@/types';
import { LOCALIDADES } from '@/data/mockData';
import { 
  MapPin, 
  Filter, 
  FileText, 
  Download, 
  ThumbsUp, 
  Share2, 
  X, 
  CheckCircle2, 
  Clock, 
  Send,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface Props {
  initialPins?: PinTerritorial[];
}

export default function StreetPinsMapInner({ initialPins = [] }: Props) {
  const [pins, setPins] = useState<PinTerritorial[]>(initialPins);
  const [selectedPin, setSelectedPin] = useState<PinTerritorial | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [selectedLocalidad, setSelectedLocalidad] = useState<string>('Todas');
  const [supportedPins, setSupportedPins] = useState<Record<string, boolean>>({});

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

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

  const pinCountByLocalidad = useMemo(() => {
    const counts: Record<string, number> = {};
    pins.forEach((p) => {
      counts[p.localidad] = (counts[p.localidad] || 0) + 1;
    });
    return counts;
  }, [pins]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center of Almirante Brown (-34.825, -58.385)
    const map = L.map(mapContainerRef.current, {
      center: [-34.815, -58.375],
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
    });

    // Capa oficial ESRI World Street Map: 100% limpia, sin marcas de agua de API key, máxima resolución de calles
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Map &copy; Esri &mdash; Almirante Brown',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when pins or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const filtered = pins.filter((pin) => {
      const matchCat = selectedCategoria === 'Todas' || pin.categoria === selectedCategoria;
      const matchLoc = selectedLocalidad === 'Todas' || pin.localidad === selectedLocalidad;
      return matchCat && matchLoc;
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
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo([pin.lat, pin.lng]);
        }
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [pins, selectedCategoria, selectedLocalidad]);

  const handleSupport = async (pinId: string) => {
    if (supportedPins[pinId]) return;
    setSupportedPins((prev) => ({ ...prev, [pinId]: true }));

    // Optimistic UI update
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

  const categories = [
    'Todas',
    'Arreglo de Calles / Asfalto',
    'Seguridad / Luminarias',
    'Proyecto de Ordenanza HCD',
    'Visita Vecinal / Reclamo',
    'Salud / CAPS',
    'Medio Ambiente / Basurales'
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-4 rounded-2xl border border-purple-500/30">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-300 uppercase flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            Tema:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoria(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategoria === cat
                  ? 'bg-amber-400 text-purple-950 font-bold shadow-md'
                  : 'bg-purple-950/40 hover:bg-purple-900/60 text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-300 uppercase whitespace-nowrap">
            Localidad:
          </span>
          <select
            value={selectedLocalidad}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedLocalidad(val);
              if (val === 'Todas') {
                if (mapInstanceRef.current) mapInstanceRef.current.flyTo([-34.815, -58.375], 12);
              } else {
                const match = LOCALIDADES.find((l) => l.nombre === val);
                if (match && mapInstanceRef.current) mapInstanceRef.current.flyTo(match.coordenadas, 14);
              }
            }}
            className="w-full md:w-56 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
          >
            <option value="Todas">Todas ({pins.length} pines)</option>
            {LOCALIDADES.map((l) => (
              <option key={l.id} value={l.nombre}>
                {l.nombre} ({pinCountByLocalidad[l.nombre] || 0})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Localities Quick Filter Chips with Pin Counter */}
      <div className="p-3 glass-panel rounded-2xl border border-purple-900/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" />
            Filtrar por Localidad & Cantidad de Proyectos:
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            Hacé click para enfocar y ver pines en esa zona
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => {
              setSelectedLocalidad('Todas');
              if (mapInstanceRef.current) mapInstanceRef.current.flyTo([-34.815, -58.375], 12);
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
              Pines Territoriales en Calles de Almirante Brown
            </span>
            <span className="text-[11px] font-semibold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30">
              {pins.length} Reclamos y Proyectos Georreferenciados
            </span>
          </div>

          <div
            ref={mapContainerRef}
            className="w-full h-[520px] rounded-2xl overflow-hidden border border-purple-900/60 z-0"
          />

          <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-2 gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Calles / Asfalto</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Seguridad</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#371859] border border-purple-400" /> HCD</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Visitas</span>
            </div>
            <span className="text-purple-300">Hacé click en un pin para ver fotos y PDF</span>
          </div>
        </div>

        {/* Detail Panel of Selected Pin (4 cols) */}
        <div className="lg:col-span-4">
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

                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{selectedPin.calle} · {selectedPin.localidad}</span>
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
          ) : (
            <div className="glass-panel rounded-3xl p-8 border border-purple-500/30 text-center flex flex-col items-center justify-center min-h-[420px]">
              <MapPin className="w-10 h-10 text-amber-400 mb-3 animate-bounce" />
              <h4 className="text-base font-bold text-white mb-1">
                Seleccioná un Pin en el Mapa
              </h4>
              <p className="text-xs text-slate-300 max-w-xs leading-relaxed">
                Hacé click en cualquiera de los puntos señalados en las calles de Almirante Brown para ver fotos del lugar, estado del bacheo/obra y descargar el proyecto de ordenanza en PDF.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
