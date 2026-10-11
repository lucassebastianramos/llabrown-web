'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { CAROUSEL_GALLERY, VISITAS_INICIALES } from '@/data/mockData';
import { VisitaTerritorial } from '@/types';
import { Camera, X, ChevronLeft, ChevronRight, MapPin, Calendar, Users } from 'lucide-react';

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
    <section id="territorio" className="py-20 relative bg-[#08040d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Nuestro Trabajo en la Calle</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Estamos en el <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">Territorio</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Recorriendo cada rincón de Almirante Brown, escuchando a los vecinos y construyendo el cambio desde la base.
          </p>

          {/* Tab Selector */}
          <div className="mt-6 inline-flex p-1 rounded-xl bg-purple-950/60 border border-purple-800/60 shadow-lg">
            <button
              onClick={() => setActiveTab('recorridas')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'recorridas'
                  ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Recorridas Recientes
            </button>
            <button
              onClick={() => setActiveTab('galeria')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'galeria'
                  ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Galería Fotográfica
            </button>
          </div>
        </div>

        {/* Tab 1: Recorridas Detalladas */}
        {activeTab === 'recorridas' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
            {visitas.map((visita) => (
              <div
                key={visita.id}
                className="glass-panel glass-panel-hover rounded-2xl overflow-hidden border border-purple-500/25 flex flex-col justify-between"
              >
                <div>
                  {/* Photo Thumbnail */}
                  <div className="relative w-full h-48 bg-purple-950/60 overflow-hidden group">
                    <Image
                      src={visita.fotos[0] || '/img/PedroAquino.jpg.jpg'}
                      alt={visita.titulo}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#0d0617]/85 backdrop-blur-sm border border-purple-500/40 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-400 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{visita.localidad}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5">
                    <div className="flex items-center gap-2 text-xs text-purple-300 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{visita.fecha}</span>
                      {visita.circuito && <span>· Circuito {visita.circuito}</span>}
                    </div>

                    <h3 className="text-base font-bold text-white mb-2 line-clamp-2">
                      {visita.titulo}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                      {visita.descripcion}
                    </p>

                    {/* Topics badges */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {visita.temasTratados.map((tema) => (
                        <span
                          key={tema}
                          className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800/40 text-[10px] text-purple-200"
                        >
                          {tema}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer with councilors */}
                <div className="px-5 py-3 bg-purple-950/30 border-t border-purple-900/40 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Concejales: {visita.concejales.join(', ')}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 2: Galería Fotográfica */}
        {activeTab === 'galeria' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 animate-fadeIn">
            {photos.map((item, index) => (
              <div
                key={index}
                onClick={() => setSelectedPhotoIndex(index)}
                className="relative aspect-square rounded-xl overflow-hidden glass-panel border border-purple-500/20 cursor-pointer group hover:border-amber-400/80 transition-all duration-300"
              >
                <Image
                  src={item.img}
                  alt={item.caption}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex items-end">
                  <span className="text-[10px] font-semibold text-white truncate">
                    {item.caption}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lightbox Modal */}
        {selectedPhotoIndex !== null && (
          <div
            onClick={() => setSelectedPhotoIndex(null)}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <button
              onClick={() => setSelectedPhotoIndex(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-purple-950/80 text-white hover:text-amber-400 border border-purple-800/60"
              aria-label="Cerrar modal"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={handlePrevPhoto}
              className="absolute left-4 sm:left-8 p-3 rounded-full bg-purple-950/80 text-white hover:text-amber-400 border border-purple-800/60"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl max-h-[85vh] flex flex-col items-center"
            >
              <div className="relative w-[90vw] max-w-3xl h-[65vh] rounded-2xl overflow-hidden border border-purple-500/50 shadow-2xl">
                <Image
                  src={photos[selectedPhotoIndex].img}
                  alt={photos[selectedPhotoIndex].caption}
                  fill
                  className="object-contain"
                />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-200 text-center max-w-lg">
                {photos[selectedPhotoIndex].caption}
              </p>
            </div>

            <button
              onClick={handleNextPhoto}
              className="absolute right-4 sm:right-8 p-3 rounded-full bg-purple-950/80 text-white hover:text-amber-400 border border-purple-800/60"
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
