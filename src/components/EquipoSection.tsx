'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CONCEJALES, CONSEJEROS } from '@/data/mockData';
import { Shield, GraduationCap, MapPin } from 'lucide-react';

export default function EquipoSection() {
  const [activeTab, setActiveTab] = useState<'concejales' | 'consejeros'>('concejales');

  const list = activeTab === 'concejales' ? CONCEJALES : CONSEJEROS;

  return (
    <section id="equipo" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado limpio */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c4c99]">
              Representación Institucional
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#1d1d1d] tracking-tight">
              Nuestro equipo
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Concejales y consejeros escolares comprometidos con la libertad, el orden institucional y la defensa del vecino de Almirante Brown.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-lg bg-slate-100 border border-slate-200 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('concejales')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'concejales'
                  ? 'bg-[#371859] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Concejales (8)</span>
            </button>
            <button
              onClick={() => setActiveTab('consejeros')}
              className={`px-4 py-2 rounded-md text-xs font-bold transition-colors flex items-center gap-2 ${
                activeTab === 'consejeros'
                  ? 'bg-[#371859] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Consejeros Escolares (4)</span>
            </button>
          </div>
        </div>

        {/* Grilla de representantes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {list.map((miembro) => (
            <div
              key={miembro.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:border-[#6c4c99]/50 hover:shadow-md transition-all flex flex-col group"
            >
              <div className="relative w-full aspect-[4/5] bg-slate-100 overflow-hidden">
                <Image
                  src={miembro.foto}
                  alt={miembro.nombre}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  style={miembro.estilo ? { objectPosition: 'center 15%' } : undefined}
                />

                {miembro.id === 'juan-pedro-aquino' && (
                  <div className="absolute top-3 left-3 bg-[#371859] text-white px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    Jefe de Bloque
                  </div>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between bg-white">
                <div>
                  <h3 className="text-lg font-extrabold text-[#1d1d1d] group-hover:text-[#371859] transition-colors">
                    {miembro.nombre}
                  </h3>
                  <span className="text-xs font-semibold text-[#6c4c99] block mt-0.5">
                    {miembro.rol}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
                    <MapPin className="w-3 h-3 text-[#371859]" />
                    <span>{miembro.localidad}</span>
                  </div>
                  {miembro.bio && (
                    <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {miembro.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
