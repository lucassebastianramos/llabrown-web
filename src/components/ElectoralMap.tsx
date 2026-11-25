'use client';

import React from 'react';
import StreetPinsMap from '@/components/StreetPinsMap';

export default function ElectoralMap() {
  return (
    <section id="mapa" className="py-20 bg-[#f5f4f8] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado limpio estilo institucional */}
        <div className="max-w-3xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1d] tracking-tight">
            Mapa territorial de Almirante Brown
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Reclamos de calles, pedidos de obras y proyectos georreferenciados en los 176 barrios oficiales (Ordenanza N° 13.906) de las 12 localidades del partido.
          </p>
        </div>

        <div className="animate-fadeIn">
          <StreetPinsMap />
        </div>
      </div>
    </section>
  );
}
