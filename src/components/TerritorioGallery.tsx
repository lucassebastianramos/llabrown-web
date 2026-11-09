'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CAROUSEL_GALLERY, VISITAS_INICIALES } from '@/data/mockData';
import { VisitaTerritorial } from '@/types';
import { X, ChevronLeft, ChevronRight, MapPin, Calendar, Users } from 'lucide-react';

export default function TerritorioGallery() {
  const [visitas, setVisitas] = useState<VisitaTerritorial[]>(VISITAS_INICIALES);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'recorridas' | 'galeria'>('recorridas');

  useEffect(() => {
    fetch('/api/visitas')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVisitas(data);
        }
      })
      .catch(() => {});
  }, []);

  const photos = CAROUSEL_GALLERY;

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex + 1) % photos.length);
    }
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPhotoIndex !== null) {
      setSelectedPhotoIndex((selectedPhotoIndex - 1 + photos.length) % photos.length);
    }
  };

  return (
    <section id="territorio" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado limpio */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c4c99]">
              Trabajo en la Calle
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#1d1d1d] tracking-tight">
              Presencia en el territorio
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Recorriendo cada localidad de Almirante Brown, escuchando a los vecinos y defendiendo las ideas de la libertad en cada barrio.
            </p>
          </div>

          {/* Selector de pestañas limpio */}
          <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('recorridas')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'recorridas'
                  ? 'bg-[#371859] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Recorridas recientes
            </button>
            <button
              onClick={() => setActiveTab('galeria')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-colors ${
                activeTab === 'galeria'
                  ? 'bg-[#371859] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Galería fotográfica
            </button>
          </div>
        </div>

        {/* Tab 1: Recorridas */}
        {activeTab === 'recorridas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {visitas.map((visita) => (
              <div
                key={visita.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:border-[#6c4c99]/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-52 bg-slate-100 overflow-hidden group">
                    <Image
                      src={visita.fotos[0] || '/img/PedroAquino.jpg.jpg'}
                      alt={visita.titulo}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#371859] px-2.5 py-1 rounded-md text-xs font-bold text-white flex items-center gap-1 shadow-sm">
                      <MapPin className="w-3.5 h-3.5 text-[#39b5e6]" />
                      <span>{visita.localidad}</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-[#6c4c99]" />
                      <span>{visita.fecha}</span>
                      {visita.circuito && <span>· Circuito {visita.circuito}</span>}
                    </div>

                    <h3 className="text-base font-bold text-[#1d1d1d] mb-2 line-clamp-2">
                      {visita.titulo}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4 line-clamp-3">
                      {visita.descripcion}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {visita.temasTratados.map((tema) => (
                        <span
                          key={tema}
                          className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200/70 text-[10px] font-semibold text-[#371859]"
                        >
                          {tema}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#371859]" />
                    <span>Concejales: {visita.concejales.join(', ')}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Galería */}
        {activeTab === 'galeria' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 animate-fadeIn">
            {photos.map((item, index) => (
              <div
                key={index}
                onClick={() => setSelectedPhotoIndex(index)}
                className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer group hover:border-[#371859] transition-all duration-200"
              >
                <Image
                  src={item.img}
                  alt={item.caption}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#230552]/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex items-end">
                  <span className="text-[11px] font-semibold text-white truncate">
                    {item.caption}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Lightbox */}
        {selectedPhotoIndex !== null && (
          <div
            onClick={() => setSelectedPhotoIndex(null)}
            className="fixed inset-0 z-50 bg-[#120629]/95 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              aria-label="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={handlePrevPhoto}
              className="absolute left-4 sm:left-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl max-h-[85vh] flex flex-col items-center"
            >
              <div className="relative w-[90vw] max-w-3xl h-[65vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black/40">
                <Image
                  src={photos[selectedPhotoIndex].img}
                  alt={photos[selectedPhotoIndex].caption}
                  fill
                  className="object-contain"
                />
              </div>
              <p className="mt-4 text-sm font-semibold text-white text-center max-w-lg">
                {photos[selectedPhotoIndex].caption}
              </p>
            </div>

            <button
              onClick={handleNextPhoto}
              className="absolute right-4 sm:right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              aria-label="Siguiente foto"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
