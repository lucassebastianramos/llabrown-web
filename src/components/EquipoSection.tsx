'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CONCEJALES, CONSEJEROS } from '@/data/mockData';
import { Users, Award, Shield, GraduationCap, MapPin } from 'lucide-react';

export default function EquipoSection() {
  const [activeTab, setActiveTab] = useState<'concejales' | 'consejeros'>('concejales');

  const list = activeTab === 'concejales' ? CONCEJALES : CONSEJEROS;

  return (
    <section id="equipo" className="py-20 relative bg-[#0b0614]">
      {/* Glow accent */}
      <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-purple-900/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Quiénes Somos</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Nuestro <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">Equipo</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Representantes comprometidos con la libertad, el orden institucional y el progreso de Almirante Brown.
          </p>

          {/* Tab Selector */}
          <div className="mt-6 inline-flex p-1 rounded-xl bg-purple-950/60 border border-purple-800/60 shadow-lg">
            <button
              onClick={() => setActiveTab('concejales')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'concejales'
                  ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Concejales (8)</span>
            </button>
            <button
              onClick={() => setActiveTab('consejeros')}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
                activeTab === 'consejeros'
                  ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Consejeros Escolares (4)</span>
            </button>
          </div>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {list.map((miembro) => (
            <div
              key={miembro.id}
              className="glass-panel glass-panel-hover rounded-2xl overflow-hidden border border-purple-500/25 flex flex-col group"
            >
              {/* Photo */}
              <div className="relative w-full aspect-[4/5] bg-purple-950/60 overflow-hidden">
                <Image
                  src={miembro.foto}
                  alt={miembro.nombre}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  style={miembro.estilo ? { objectPosition: 'center 15%' } : undefined}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0617] via-transparent to-transparent opacity-60" />
                
                {miembro.id === 'juan-pedro-aquino' && (
                  <div className="absolute top-3 left-3 bg-amber-400 text-purple-950 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-md">
                    Jefe de Bloque
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-[#110724]/90">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                    {miembro.nombre}
                  </h3>
                  <span className="text-xs font-semibold text-purple-300 block mt-0.5">
                    {miembro.rol}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-2">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{miembro.localidad}</span>
                  </div>
                  {miembro.bio && (
                    <p className="mt-3 text-xs text-slate-300 line-clamp-3 leading-relaxed">
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
