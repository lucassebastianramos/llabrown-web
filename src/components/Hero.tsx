'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, FileText, MapPin } from 'lucide-react';

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
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white/95">
              <span className="w-2 h-2 rounded-full bg-[#39b5e6]" />
              <span>Honorable Concejo Deliberante de Almirante Brown</span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-[-0.03em] text-white leading-[1.06]">
              Defendemos al vecino en el Concejo y en cada barrio de Brown
            </h1>

            <p className="mt-5 text-base sm:text-lg text-white/85 max-w-[60ch] leading-relaxed">
              Impulsamos proyectos reales de baja de tasas y control del gasto municipal, recorremos las 13 localidades del distrito y auditamos cada reclamo barrial con número de seguimiento.
            </p>

            {/* Acciones principales con jerarquía clara (page-cro) */}
            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <a
                href="#reclamos"
                className="min-h-[46px] px-6 py-3 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-bold text-sm transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <span>Cargar reclamo vecinal</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#contacto"
                className="min-h-[46px] px-6 py-3 rounded-lg border border-white/40 hover:bg-white/10 text-white font-semibold text-sm transition-colors inline-flex items-center"
              >
                Sumate en tu localidad
              </a>

              <a
                href="#proyectos"
                className="min-h-[44px] px-3 py-2.5 text-white/85 hover:text-white font-semibold text-sm transition-colors inline-flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-[#39b5e6]" />
                <span>Ver proyectos en el HCD</span>
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/75">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#39b5e6]" />
                Sede Central: Humberto Primo 990, Burzaco
              </span>
              <span className="font-semibold text-[#39b5e6]">#TuVozConstruye</span>
            </div>
          </div>

          {/* Columna Fotográfica Real */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#230552]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src="/img/a6.jpg"
                  alt="Bloque de concejales y consejeros escolares de La Libertad Avanza en Almirante Brown"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
              <div className="px-5 py-3.5 bg-[#230552] border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-white">
                  Bloque de Concejales y Consejeros Escolares
                </span>
                <span className="text-white/80 shrink-0">
                  Jefe de Bloque: Juan Pedro Aquino
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Datos institucionales verificables */}
        <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums block tracking-tight">
              13
            </span>
            <span className="text-xs font-medium text-white/80 mt-1 block">
              Localidades con equipo activo
            </span>
          </div>

          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums block tracking-tight">
              8
            </span>
            <span className="text-xs font-medium text-white/80 mt-1 block">
              Concejales en el HCD
            </span>
          </div>

          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums block tracking-tight">
              4
            </span>
            <span className="text-xs font-medium text-white/80 mt-1 block">
              Consejeros escolares
            </span>
          </div>

          <div>
            <span className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums block tracking-tight">
              176
            </span>
            <span className="text-xs font-medium text-white/80 mt-1 block">
              Barrios relevados (Ord. 13.906)
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
