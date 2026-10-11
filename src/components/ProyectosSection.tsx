'use client';

import React, { useState, useEffect } from 'react';
import { PROYECTOS_INICIALES } from '@/data/mockData';
import { ProyectoHCD } from '@/types';
import { FileText, Search, Tag, CheckCircle2, Clock, Landmark, Filter } from 'lucide-react';

export default function ProyectosSection() {
  const [proyectos, setProyectos] = useState<ProyectoHCD[]>(PROYECTOS_INICIALES);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    fetch('/api/proyectos')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProyectos(data);
        }
      })
      .catch(() => {});
  }, []);

  const categories = [
    'Todas',
    'Baja de Tasas',
    'Seguridad',
    'Desregulación',
    'Educación',
    'Infraestructura',
    'Salud'
  ];

  const filteredProyectos = proyectos.filter((p) => {
    const matchesCategory = selectedCategory === 'Todas' || p.categoria === selectedCategory;
    const matchesSearch = 
      p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.resumen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.localidad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.expediente && p.expediente.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="proyectos" className="py-20 relative bg-[#0b0614]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Landmark className="w-3.5 h-3.5 text-amber-400" />
            <span>Honorable Concejo Deliberante</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Proyectos de <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-amber-400">Ordenanza</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Iniciativas legislativas presentadas por el bloque de La Libertad Avanza Brown para aliviar el bolsillo de los vecinos, desregular y ordenar el municipio.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-md'
                    : 'bg-purple-950/40 hover:bg-purple-900/60 border border-purple-900/50 text-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tema o localidad..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-purple-950/40 border border-purple-800/60 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProyectos.map((proyecto) => (
            <div
              key={proyecto.id}
              className="glass-panel glass-panel-hover rounded-2xl p-6 border border-purple-500/25 flex flex-col justify-between"
            >
              <div>
                {/* Status & Category */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-900/60 border border-purple-700/60 text-[11px] font-semibold text-purple-200">
                    {proyecto.categoria}
                  </span>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                      proyecto.estado === 'Aprobado'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : proyecto.estado === 'En Comisión'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{proyecto.estado}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mb-2 leading-snug">
                  {proyecto.titulo}
                </h3>

                {proyecto.expediente && (
                  <span className="text-[11px] font-mono text-amber-400/90 block mb-3">
                    {proyecto.expediente}
                  </span>
                )}

                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {proyecto.resumen}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-purple-900/40 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-slate-300">
                  Autor: <strong className="text-white">{proyecto.autor}</strong>
                </span>
                <span className="text-purple-300 font-medium">
                  {proyecto.localidad}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredProyectos.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No se encontraron proyectos con ese criterio de búsqueda.</p>
          </div>
        )}
      </div>
    </section>
  );
}
