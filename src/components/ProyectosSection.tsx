'use client';

import React, { useState, useEffect } from 'react';
import { PROYECTOS_INICIALES } from '@/data/mockData';
import { ProyectoHCD } from '@/types';
import { FileText, Search, Clock, Landmark, ExternalLink, FileCheck } from 'lucide-react';
import { getDigestoSearchUrl } from '@/lib/digestoService';

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
    'Salud',
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
    <section id="proyectos" className="py-20 bg-[#f5f4f8] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado limpio */}
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c4c99]">
            Honorable Concejo Deliberante
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#1d1d1d] tracking-tight">
            Proyectos de ordenanza
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Iniciativas legislativas impulsadas por el bloque de La Libertad Avanza Almirante Brown para aliviar el bolsillo de los vecinos, desregular trámites y auditar el gasto municipal. Consultá cada expediente en el Digesto Oficial o descargá el PDF con un clic.
          </p>
        </div>

        {/* Barra de categorías y búsqueda */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#371859] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-[#6c4c99] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por tema o expediente..."
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] transition-colors"
            />
          </div>
        </div>

        {/* Grilla de proyectos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProyectos.map((proyecto) => {
            const digestoUrl = getDigestoSearchUrl(proyecto.expediente, proyecto.titulo);

            return (
              <div
                key={proyecto.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:border-[#6c4c99]/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[11px] font-bold text-[#371859]">
                      {proyecto.categoria}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        proyecto.estado === 'Aprobado'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      <span>{proyecto.estado}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#1d1d1d] mb-2 leading-snug">
                    {proyecto.titulo}
                  </h3>

                  {proyecto.expediente && (
                    <div className="mb-3">
                      <a
                        href={proyecto.archivoPdf || digestoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 hover:bg-purple-100 border border-purple-200 text-[#371859] font-mono text-[11px] font-bold transition-colors group/exp"
                        title={
                          proyecto.archivoPdf
                            ? 'Abrir archivo PDF oficial'
                            : 'Buscar expediente en Digesto Oficial HCD'
                        }
                      >
                        <FileCheck className="w-3.5 h-3.5 text-[#371859]" />
                        <span>{proyecto.expediente}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover/exp:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    {proyecto.resumen}
                  </p>
                </div>

                <div>
                  <div className="pt-3 pb-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {proyecto.archivoPdf ? (
                      <>
                        <a
                          href={proyecto.archivoPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-3 py-2 rounded-lg bg-[#371859] hover:bg-[#230552] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Expediente PDF</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>

                        <a
                          href={digestoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                          title="Consultar expediente en el Digesto Oficial del HCD"
                        >
                          <Search className="w-3.5 h-3.5 text-[#371859]" />
                          <span>Digesto HCD</span>
                        </a>
                      </>
                    ) : (
                      <a
                        href={digestoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full px-3 py-2 rounded-lg bg-slate-100 hover:bg-[#371859] text-[#371859] hover:text-white border border-slate-200 hover:border-[#371859] text-xs font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <Landmark className="w-3.5 h-3.5" />
                        <span>Ver en Digesto Oficial HCD</span>
                        <ExternalLink className="w-3 h-3 opacity-75" />
                      </a>
                    )}
                  </div>

                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Autor: <strong className="text-slate-800">{proyecto.autor}</strong>
                    </span>
                    <span className="text-[#6c4c99] font-semibold">
                      {proyecto.localidad}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProyectos.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-sm">No se encontraron proyectos con ese criterio de búsqueda.</p>
          </div>
        )}
      </div>
    </section>
  );
}
