'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LOCALIDADES, PROYECTOS_INICIALES, VISITAS_INICIALES, PINES_INICIALES } from '@/data/mockData';
import { PinTerritorial } from '@/types';
import { 
  MapPin, 
  Layers, 
  MessageCircle, 
  CheckCircle2, 
  Compass, 
  Building2, 
  FileText, 
  ChevronRight,
  Info
} from 'lucide-react';
import StreetPinsMap from '@/components/StreetPinsMap';

interface CircuitData {
  circuito: string;
  nombre: string;
  localidadesPrincipales: string[];
  descripcion: string;
  referente: string;
  wa: string;
  color: string;
  path: string;
  centroid: [number, number];
}

interface MapJson {
  viewBox: string;
  circuits: CircuitData[];
}

export default function ElectoralMap() {
  const [mapData, setMapData] = useState<MapJson | null>(null);
  const [pines, setPines] = useState<PinTerritorial[]>(PINES_INICIALES);
  const [selectedCircuit, setSelectedCircuit] = useState<CircuitData | null>(null);
  const [hoveredCircuit, setHoveredCircuit] = useState<CircuitData | null>(null);
  const [selectedLocalidadId, setSelectedLocalidadId] = useState<string | null>('burzaco');
  const [viewMode, setViewMode] = useState<'pines' | 'circuitos' | 'localidades'>('pines');

  useEffect(() => {
    fetch('/data/almirante-brown-svg.json')
      .then((res) => res.json())
      .then((data: MapJson) => {
        setMapData(data);
        // Default select Circuito 19 (Burzaco - Sede)
        const burzaco = data.circuits.find((c) => c.circuito === '0019') || data.circuits[0];
        setSelectedCircuit(burzaco);
      })
      .catch((err) => console.error('Error loading electoral map:', err));

    fetch('/api/pines')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPines(data);
        }
      })
      .catch(() => {});
  }, []);

  const pinCountByLocalidad = useMemo(() => {
    const counts: Record<string, number> = {};
    pines.forEach((p) => {
      counts[p.localidad] = (counts[p.localidad] || 0) + 1;
    });
    return counts;
  }, [pines]);

  const handleSelectCircuit = (circuit: CircuitData) => {
    setSelectedCircuit(circuit);
    if (circuit.localidadesPrincipales.length > 0) {
      const match = LOCALIDADES.find((l) => 
        circuit.localidadesPrincipales.some((lp) => lp.toLowerCase() === l.nombre.toLowerCase())
      );
      if (match) setSelectedLocalidadId(match.id);
    }
  };

  const handleSelectLocalidad = (id: string) => {
    setSelectedLocalidadId(id);
    const loc = LOCALIDADES.find((l) => l.id === id);
    if (loc && mapData) {
      const circuitMatch = mapData.circuits.find((c) => c.circuito === loc.circuito);
      if (circuitMatch) setSelectedCircuit(circuitMatch);
    }
  };

  const currentLocalidad = LOCALIDADES.find((l) => l.id === selectedLocalidadId);

  // Filter projects and visits for current zone
  const zoneProjects = PROYECTOS_INICIALES.filter((p) => {
    if (!currentLocalidad) return false;
    return p.localidad.toLowerCase().includes(currentLocalidad.nombre.toLowerCase()) || p.localidad === 'Almirante Brown';
  });

  const zoneVisits = VISITAS_INICIALES.filter((v) => {
    if (!currentLocalidad) return false;
    return v.localidad.toLowerCase().includes(currentLocalidad.nombre.toLowerCase());
  });

  return (
    <section id="mapa" className="py-20 relative bg-[#0b0614]">
      {/* Background accents */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-purple-900/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Mapas Oficiales de la Justicia Electoral PBA</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Mapa Electoral & <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-400">Territorio Brown</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Explorá los 11 circuitos electorales y las 12 localidades del distrito. Seleccioná una zona para ver proyectos, recorridas y contactar al referente barrial.
          </p>

          {/* View Mode Switcher */}
          <div className="mt-6 inline-flex flex-wrap justify-center p-1 rounded-xl bg-purple-950/60 border border-purple-800/60 shadow-lg gap-1">
            <button
              onClick={() => setViewMode('pines')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewMode === 'pines'
                  ? 'bg-gradient-to-r from-purple-700 to-amber-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Pines en Calles (Bacheo, Obras y Seguridad)</span>
            </button>
            <button
              onClick={() => setViewMode('circuitos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewMode === 'circuitos'
                  ? 'bg-gradient-to-r from-purple-700 to-amber-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Circuitos Electorales</span>
            </button>
            <button
              onClick={() => setViewMode('localidades')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                viewMode === 'localidades'
                  ? 'bg-gradient-to-r from-purple-700 to-amber-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>13 Localidades</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: STREET PINS MAP (Leaflet en calles de Brown) */}
        {viewMode === 'pines' && (
          <div className="animate-fadeIn">
            <StreetPinsMap />
          </div>
        )}

        {/* VIEW 2 & 3: CIRCUITOS ELECTORALES & LOCALIDADES (SVG GeoJSON) */}
        {viewMode !== 'pines' && (
          <div className="animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Map Container (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-4 sm:p-6 border border-purple-500/30 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-purple-900/40">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Almirante Brown · 3ra Sección Electoral
                </span>
              </div>
              <span className="text-[11px] font-semibold text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800/60">
                11 Circuitos · 13 Localidades
              </span>
            </div>

            {/* SVG Interactive Map */}
            <div className="relative w-full aspect-[700/750] bg-[#0f071e]/70 rounded-2xl overflow-hidden border border-purple-900/40 p-2 flex items-center justify-center">
              {mapData ? (
                <svg
                  viewBox={mapData.viewBox}
                  className="w-full h-full max-h-[620px] drop-shadow-xl"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="6" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Polygons */}
                  {mapData.circuits.map((c) => {
                    const isSelected = selectedCircuit?.circuito === c.circuito;
                    const isHovered = hoveredCircuit?.circuito === c.circuito;

                    return (
                      <g key={c.circuito} className="group">
                        <path
                          d={c.path}
                          onClick={() => handleSelectCircuit(c)}
                          onMouseEnter={() => setHoveredCircuit(c)}
                          onMouseLeave={() => setHoveredCircuit(null)}
                          className="circuit-polygon transition-all duration-300"
                          fill={isSelected ? '#7c3aed' : isHovered ? '#6d28d9' : c.color}
                          fillOpacity={isSelected ? 0.75 : isHovered ? 0.55 : 0.3}
                          stroke={isSelected ? '#fbbf24' : isHovered ? '#f59e0b' : '#a78bfa'}
                          strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                          filter={isSelected ? 'url(#glowEffect)' : undefined}
                        />

                        {/* Centroid Label */}
                        <text
                          x={c.centroid[0]}
                          y={c.centroid[1]}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize="11"
                          fontWeight="700"
                          className="pointer-events-none select-none drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]"
                        >
                          {viewMode === 'circuitos' ? `C. ${c.circuito}` : c.localidadesPrincipales[0] || c.circuito}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs font-semibold">Cargando geometrías electorales...</span>
                </div>
              )}

              {/* Hover Floating Tooltip */}
              {hoveredCircuit && (
                <div className="absolute top-4 left-4 bg-[#140b24]/95 border border-amber-400/60 p-2.5 rounded-xl shadow-xl pointer-events-none text-left backdrop-blur-md transition-all">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Circuito Electoral {hoveredCircuit.circuito}
                  </span>
                  <span className="text-xs font-bold text-white block">
                    {hoveredCircuit.nombre}
                  </span>
                  <span className="text-[11px] text-slate-300 block">
                    {hoveredCircuit.localidadesPrincipales.join(', ')}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-purple-400" />
                Hacé click en cualquier circuito para ver el detalle y contactar al referente
              </span>
              <span className="text-amber-400/80 font-semibold">Fuente: Justicia Electoral PBA</span>
            </div>
          </div>

          {/* Detail Sidebar (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {selectedCircuit ? (
              <div className="glass-panel rounded-3xl p-6 border border-purple-500/30 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-3 py-1 rounded-full bg-purple-900/60 border border-purple-700/60 text-purple-200 text-xs font-bold">
                    Circuito {selectedCircuit.circuito}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold">
                    Sección 3ra PBA
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white mb-2">
                  {selectedCircuit.nombre}
                </h3>

                <p className="text-slate-300 text-sm leading-relaxed mb-4">
                  {selectedCircuit.descripcion}
                </p>

                {/* Localidades covered */}
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-900/50 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                      Localidades Abarcadas & Pines
                    </span>
                    <span className="text-[10px] text-purple-300 font-semibold">
                      Proyectos / Pedidos Activos
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCircuit.localidadesPrincipales.map((loc) => {
                      const count = pinCountByLocalidad[loc] || 0;
                      return (
                        <div
                          key={loc}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-900/40 border border-purple-700/40 text-xs text-slate-200 font-medium"
                        >
                          <span>{loc}</span>
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-bold text-[10px]">
                            {count} {count === 1 ? 'pin' : 'pines'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coordinator & Contact */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-[#1b0c36] border border-purple-700/40 mb-4">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 block mb-1">
                    Atención Territorial
                  </span>
                  <p className="text-sm font-bold text-white mb-1">
                    {selectedCircuit.referente}
                  </p>
                  <p className="text-xs text-slate-300 mb-3">
                    Asesoramiento a vecinos, recepción de propuestas para el HCD y fiscalización.
                  </p>
                  <a
                    href={selectedCircuit.wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Hablar por WhatsApp con el Referente</span>
                  </a>
                </div>

                {/* Related Projects in this zone */}
                {zoneProjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-purple-900/40">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-2">
                      <FileText className="w-3.5 h-3.5" />
                      Proyectos LLA para esta zona
                    </span>
                    <div className="space-y-2">
                      {zoneProjects.slice(0, 2).map((proj) => (
                        <div key={proj.id} className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-900/40 text-xs">
                          <span className="font-bold text-white block mb-0.5">{proj.titulo}</span>
                          <span className="text-[11px] text-purple-300">{proj.categoria} · {proj.estado}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl p-8 border border-purple-500/30 text-center flex flex-col items-center justify-center min-h-[350px]">
                <MapPin className="w-10 h-10 text-purple-400 mb-3 animate-bounce" />
                <h4 className="text-lg font-bold text-white mb-1">Seleccioná un Circuito</h4>
                <p className="text-xs text-slate-300 max-w-xs">
                  Hacé click en cualquiera de las zonas del mapa o elegí una localidad abajo para ver los datos electorales.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

        {/* 13 Localities Quick Access Buttons with Project Counter */}
        <div className="mt-12 pt-8 border-t border-purple-900/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Acceso Rápido y Cantidad de Proyectos por Localidad</span>
            </h3>
            <span className="text-xs text-slate-400 hidden sm:inline">
              Hacé click para enfocar localidad y ver proyectos
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {LOCALIDADES.map((loc) => {
              const isSelected = selectedLocalidadId === loc.id;
              const count = pinCountByLocalidad[loc.nombre] || 0;
              return (
                <button
                  key={loc.id}
                  onClick={() => handleSelectLocalidad(loc.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-700 to-amber-500 text-white border-amber-300 shadow-lg shadow-purple-600/30 scale-102'
                      : 'bg-purple-950/30 hover:bg-purple-900/40 border-purple-900/60 text-slate-200 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">{loc.nombre}</span>
                    <span
                      title={`${count} proyectos/pedidos en ${loc.nombre}`}
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${
                        isSelected
                          ? 'bg-black/40 text-amber-300 border border-amber-300/40'
                          : 'bg-purple-900/80 text-amber-400 border border-purple-700/60'
                      }`}
                    >
                      {count} {count === 1 ? 'pin' : 'pines'}
                    </span>
                  </div>
                  <span className="text-[10px] text-purple-300/80 block mt-1">Circuito {loc.circuito}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
