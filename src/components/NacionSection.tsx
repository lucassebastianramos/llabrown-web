'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { NOTICIAS_INICIALES, DEFAULT_SITE_CONFIG } from '@/data/seedDefaults';
import { NoticiaAmbito, NoticiaItem, SiteConfig } from '@/types';
import { Calendar, ExternalLink, Flag, MapPin, Newspaper, X } from 'lucide-react';

const AMBITOS: Array<'Todas' | NoticiaAmbito> = [
  'Todas',
  'Nación',
  'Provincia',
  'Distrito',
  'Novedades',
];

export default function NacionSection() {
  const [noticias, setNoticias] = useState<NoticiaItem[]>(NOTICIAS_INICIALES);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [selectedAmbito, setSelectedAmbito] = useState<'Todas' | NoticiaAmbito>('Todas');
  const [activeNoticia, setActiveNoticia] = useState<NoticiaItem | null>(null);

  useEffect(() => {
    fetch('/api/noticias')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setNoticias(data);
      })
      .catch(() => {});

    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.nacionTitulo) setConfig(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeNoticia) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveNoticia(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeNoticia]);

  const filtered =
    selectedAmbito === 'Todas'
      ? noticias
      : noticias.filter((n) => n.ambito === selectedAmbito);

  return (
    <section id="nacion" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado editorial Nación y Provincia */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-xs font-bold text-[#371859] mb-3">
              <Flag className="w-3.5 h-3.5 text-[#39b5e6]" />
              <span>Nación · Provincia · Almirante Brown</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1d] tracking-tight">
              {config.nacionTitulo}
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              {config.nacionBajada}
            </p>
          </div>

          {/* Filtros de ámbito */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {AMBITOS.map((amb) => (
              <button
                key={amb}
                type="button"
                onClick={() => setSelectedAmbito(amb)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  selectedAmbito === amb
                    ? 'bg-[#371859] text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {amb}
              </button>
            ))}
          </div>
        </div>

        {/* Franja institucional Nación + enlace a Legisladores */}
        <div className="mb-10 p-6 rounded-2xl bg-[#230552] text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h3 className="text-lg font-extrabold text-white">
              Trabajo coordinado con el Congreso Nacional y la Legislatura Bonaerense
            </h3>
            <p className="text-xs sm:text-sm text-white/80 mt-1.5 leading-relaxed">
              Cada noticia y comunicado publicado aquí pasa por validación de Prensa y Coordinación Distrital para garantizar información verificada para los vecinos de Brown.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="#equipo"
              className="min-h-[42px] px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-bold text-xs inline-flex items-center gap-2 transition-colors"
            >
              <span>Ver legisladores nacionales y provinciales</span>
            </a>
            <a
              href={`mailto:${config.emailPrensa}`}
              className="min-h-[42px] px-4 py-2 rounded-lg border border-white/30 hover:bg-white/10 text-white font-semibold text-xs inline-flex items-center gap-2 transition-colors"
            >
              <span>Prensa: {config.emailPrensa}</span>
            </a>
          </div>
        </div>

        {/* Grilla de Noticias aprobadas */}
        {filtered.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-sm">
            Todavía no hay publicaciones cargadas en esta categoría.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:border-[#6c4c99]/50 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative w-full h-48 bg-slate-100 overflow-hidden">
                    <Image
                      src={item.imagenUrl || '/img/a6.jpg'}
                      alt={item.titulo}
                      fill
                      className="object-cover"
                    />
                    <span
                      className={`absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-sm ${
                        item.ambito === 'Nación'
                          ? 'bg-[#371859] text-white'
                          : item.ambito === 'Provincia'
                            ? 'bg-[#39b5e6] text-[#120629]'
                            : 'bg-white text-[#371859]'
                      }`}
                    >
                      {item.ambito}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mb-2">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#6c4c99]" />
                        {item.fecha}
                      </span>
                      {item.localidad && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#371859]" />
                          {item.localidad}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-extrabold text-[#1d1d1d] leading-snug mb-2">
                      {item.titulo}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {item.bajada}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-600 truncate">
                    Por <strong className="text-slate-800">{item.autor}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveNoticia(item)}
                    className="text-xs font-bold text-[#371859] hover:underline inline-flex items-center gap-1 shrink-0"
                  >
                    <Newspaper className="w-3.5 h-3.5" />
                    <span>Leer nota</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Modal de lectura completa */}
        {activeNoticia && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={activeNoticia.titulo}
            onClick={() => setActiveNoticia(null)}
            className="fixed inset-0 z-50 bg-[#120629]/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white text-[#1d1d1d] shadow-2xl"
            >
              <div className="relative h-56 w-full bg-slate-100">
                <Image
                  src={activeNoticia.imagenUrl || '/img/a6.jpg'}
                  alt={activeNoticia.titulo}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setActiveNoticia(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-[#120629]/80 text-white hover:bg-[#120629]"
                  aria-label="Cerrar nota"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="absolute bottom-4 left-4 px-3 py-1 rounded-md bg-[#371859] text-white text-xs font-bold">
                  {activeNoticia.ambito}
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{activeNoticia.fecha}</span>
                  <span>·</span>
                  <span>{activeNoticia.autor}</span>
                  {activeNoticia.localidad && (
                    <>
                      <span>·</span>
                      <span>{activeNoticia.localidad}</span>
                    </>
                  )}
                </div>

                <h3 className="text-2xl font-extrabold text-[#1d1d1d] leading-tight">
                  {activeNoticia.titulo}
                </h3>

                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  {activeNoticia.bajada}
                </p>

                <div className="pt-3 border-t border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {activeNoticia.cuerpo}
                </div>

                {activeNoticia.fuenteUrl && (
                  <div className="pt-2">
                    <a
                      href={activeNoticia.fuenteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#371859] hover:underline"
                    >
                      <span>Ver documento o fuente oficial</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
