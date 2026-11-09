'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, MapPin } from 'lucide-react';

export default function Hero() {
  return (
    <section
      id="inicio"
      className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-gradient-to-b from-[#371859] to-[#230552] text-white"
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Columna Editorial */}
          <div className="lg:col-span-7 text-left">
            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.18em] text-[#39b5e6]">
              Almirante Brown · Bloque Institucional
            </p>

            <h1 className="mt-3 text-3xl sm:text-5xl lg:text-[3.35rem] font-extrabold tracking-tight text-white leading-[1.08]">
              La libertad avanza en cada barrio de Almirante Brown
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/85 max-w-2xl leading-relaxed">
              Presencia territorial activa en las 13 localidades, proyectos reales de baja de tasas y transparencia en el Honorable Concejo Deliberante, y seguimiento directo de reclamos vecinales.
            </p>

            <p className="mt-4 text-sm font-bold tracking-wide text-[#39b5e6]">
              #TuVozConstruye
            </p>

            {/* Acciones principales */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="https://wa.me/5491131596936?text=Hola%20quiero%20sumarme%20a%20La%20Libertad%20Avanza%20Brown"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-bold text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>Sumate</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#reclamos"
                className="px-6 py-3.5 rounded-lg border border-white/40 hover:bg-white/10 text-white font-semibold text-sm transition-colors"
              >
                Cargar reclamo vecinal
              </a>

              <a
                href="#mapa"
                className="px-4 py-3 text-white/85 hover:text-white font-semibold text-sm transition-colors inline-flex items-center gap-1.5"
              >
                <MapPin className="w-4 h-4 text-[#39b5e6]" />
                <span>Ver mapa territorial</span>
              </a>
            </div>
          </div>

          {/* Columna Fotográfica Real */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#230552]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/img/a6.jpg"
                  alt="Trabajo legislativo y territorial de La Libertad Avanza en Almirante Brown"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="px-5 py-3.5 bg-[#230552] border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-white">
                  Bloque de Concejales y Consejeros Escolares
                </span>
                <span className="text-white/75 shrink-0">
                  Coord. Juan Pedro Aquino
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Métricas Institucionales Limpias */}
        <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums block">
              13
            </span>
            <span className="text-xs font-semibold text-white/75 uppercase tracking-wider mt-1 block">
              Localidades del distrito
            </span>
          </div>

          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums block">
              8
            </span>
            <span className="text-xs font-semibold text-white/75 uppercase tracking-wider mt-1 block">
              Concejales en el HCD
            </span>
          </div>

          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums block">
              4
            </span>
            <span className="text-xs font-semibold text-white/75 uppercase tracking-wider mt-1 block">
              Consejeros Escolares
            </span>
          </div>

          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums block">
              176
            </span>
            <span className="text-xs font-semibold text-white/75 uppercase tracking-wider mt-1 block">
              Barrios oficiales (Ord. 13.906)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
