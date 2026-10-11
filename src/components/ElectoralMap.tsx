'use client';

import React from 'react';
import StreetPinsMap from '@/components/StreetPinsMap';

export default function ElectoralMap() {
  return (
    <section id="mapa" className="py-20 relative bg-[#08040d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Mapa Territorial de Almirante Brown
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Obras, reclamos de calles y ordenanzas georreferenciadas en los 155 barrios oficiales (Ord. N° 13.906) y 13 localidades del distrito.
          </p>
        </div>

        {/* Leaflet Street Pins Map con ESRI y máscara territorial de Almirante Brown */}
        <div className="animate-fadeIn">
          <StreetPinsMap />
        </div>
      </div>
    </section>
  );
}
