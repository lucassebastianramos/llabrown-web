'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { CONCEJALES, CONSEJEROS } from '@/data/mockData';
import { LEGISLADORES_INICIALES } from '@/data/seedDefaults';
import { MiembroEquipo, TipoMiembroEquipo } from '@/types';
import { Building2, Flag, GraduationCap, MapPin, Shield } from 'lucide-react';

export default function EquipoSection() {
  const [activeTab, setActiveTab] = useState<TipoMiembroEquipo>('concejal');
  const [miembros, setMiembros] = useState<MiembroEquipo[]>([
    ...CONCEJALES,
    ...CONSEJEROS,
    ...LEGISLADORES_INICIALES,
  ]);

  useEffect(() => {
    fetch('/api/equipo')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMiembros(data);
        }
      })
      .catch(() => {});
  }, []);

  const byTipo = (t: TipoMiembroEquipo) => miembros.filter((m) => m.tipo === t);
  const list = byTipo(activeTab);

  const tabs: Array<{ id: TipoMiembroEquipo; label: string; icon: React.ReactNode; count: number }> = [
    { id: 'concejal', label: 'Concejales', icon: <Shield className="w-3.5 h-3.5" />, count: byTipo('concejal').length },
    { id: 'consejero', label: 'Consejeros Escolares', icon: <GraduationCap className="w-3.5 h-3.5" />, count: byTipo('consejero').length },
    { id: 'legislador_provincial', label: 'Legisladores Provinciales', icon: <Building2 className="w-3.5 h-3.5" />, count: byTipo('legislador_provincial').length },
    { id: 'legislador_nacional', label: 'Legisladores Nacionales', icon: <Flag className="w-3.5 h-3.5" />, count: byTipo('legislador_nacional').length },
  ];

  return (
    <section id="equipo" className="py-20 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 mb-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1d] tracking-tight">
              Concejales, consejeros y legisladores
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              Representantes de La Libertad Avanza en el Concejo Deliberante, el Consejo Escolar de Almirante Brown, la Legislatura bonaerense y el Congreso de la Nación.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[42px] px-4 py-2 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-2 border ${
                  activeTab === tab.id
                    ? 'bg-[#371859] text-white border-[#371859] shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {tab.icon}
                <span>
                  {tab.label} ({tab.count})
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
          {list.map((miembro) => (
            <article
              key={miembro.id}
              className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:border-[#6c4c99]/50 hover:shadow-md transition-all flex flex-col group"
            >
              <div className="relative w-full aspect-[4/5] bg-slate-100 overflow-hidden">
                <Image
                  src={miembro.foto || '/img/a6.jpg'}
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
                    <p className="mt-3 text-xs text-slate-600 line-clamp-4 leading-relaxed">
                      {miembro.bio}
                    </p>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
