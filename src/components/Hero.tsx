'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, MapPin, Users, Award, FileText, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section id="inicio" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-700/20 rounded-full blur-[120px] pointer-events-none animate-glow" />
      <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-amber-500/15 rounded-full blur-[100px] pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#7c3aed0a_1px,transparent_1px),linear-gradient(to_bottom,#7c3aed0a_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Top Tag */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs sm:text-sm font-semibold tracking-wider uppercase mb-6 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>El cambio empieza acá · Almirante Brown</span>
        </div>

        {/* Logo */}
        <div className="relative w-36 h-36 sm:w-44 sm:h-44 my-2 drop-shadow-[0_0_35px_rgba(124,58,237,0.45)] hover:scale-105 transition-transform duration-300">
          <Image
            src="/img/logo.png"
            alt="La Libertad Avanza"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Main Title */}
        <h1 className="mt-4 text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
            #Tu voz
          </span>{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 underline decoration-purple-500/60 decoration-wavy decoration-2">
            construye
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-2xl font-medium leading-relaxed">
          Más libertad para los vecinos de Almirante Brown. Presencia territorial real, proyectos de ordenanza concretos y la fuerza del cambio en cada barrio.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#contacto"
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-sm sm:text-base shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 group"
          >
            <span>Sumate al cambio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href="#mapa"
            className="px-6 py-3.5 rounded-xl border border-purple-500/50 bg-purple-950/40 hover:bg-purple-900/60 text-slate-200 hover:text-white font-semibold text-sm sm:text-base transition-all flex items-center gap-2 backdrop-blur-sm"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Mapa Electoral y Localidades</span>
          </a>

          <a
            href="#interactivo"
            className="px-6 py-3.5 rounded-xl border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-sm sm:text-base transition-all flex items-center gap-2 backdrop-blur-sm"
          >
            <span>Recorrido Interactivo</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-bold">Nuevo</span>
          </a>
        </div>

        {/* Stats Row */}
        <div className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
          <div className="p-4 rounded-2xl glass-panel glass-panel-hover flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">13</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-300 mt-1 uppercase tracking-wider">
              Localidades
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-panel glass-panel-hover flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-400">8</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-300 mt-1 uppercase tracking-wider">
              Concejales
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-panel glass-panel-hover flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-amber-400">4</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-300 mt-1 uppercase tracking-wider">
              Consejeros Escolares
            </span>
          </div>

          <div className="p-4 rounded-2xl glass-panel glass-panel-hover flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-extrabold text-purple-400">11</span>
            <span className="text-xs sm:text-sm font-semibold text-slate-300 mt-1 uppercase tracking-wider">
              Circuitos Electorales
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
