'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckSquare, ClipboardCheck, FileText } from 'lucide-react';

export default function PlataformasStrip() {
  return (
    <section className="py-16 bg-[#f5f4f8] border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarjeta 1: Plataforma de Fiscalización Electoral */}
          <div className="rounded-2xl bg-[#230552] text-white p-7 sm:p-8 border border-white/10 shadow-md flex flex-col justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-[#39b5e6] text-xs font-bold mb-4">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Operativo Electoral · Almirante Brown</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                Sistema de Fiscalización Electoral
              </h2>
              <p className="mt-3 text-sm text-white/80 leading-relaxed">
                Plataforma operativa para fiscales generales, fiscales de mesa y coordinadores de las 12 localidades: mapa de escuelas, cobertura de mesas, actas, incidencias y carga de resultados en tiempo real.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="/fiscalizacion"
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-bold text-sm inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <span>Ingresar al sistema</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="/f/fiscalizacion"
                className="min-h-[44px] px-4 py-2.5 rounded-lg border border-white/30 hover:bg-white/10 text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <ClipboardCheck className="w-4 h-4 text-[#39b5e6]" />
                <span>Inscribirme como fiscal</span>
              </Link>
            </div>
          </div>

          {/* Tarjeta 2: Página dedicada de Expedientes HCD */}
          <div className="rounded-2xl bg-white text-[#1d1d1d] p-7 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#371859] text-xs font-bold mb-4">
                <FileText className="w-3.5 h-3.5" />
                <span>Honorable Concejo Deliberante</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d1d1d]">
                Expedientes y Proyectos de Ordenanza
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Consultá en su sección dedicada cada proyecto impulsado por el bloque de concejales de La Libertad Avanza: baja de tasas, seguridad, salud y desregulación con PDF y acceso al Digesto Oficial.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/expedientes"
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-sm inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <span>Ver todos los expedientes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://a.brown.gob.ar/hcd/digesto"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-[#371859]" />
                <span>Digesto Oficial HCD</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
