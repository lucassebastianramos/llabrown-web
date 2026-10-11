'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, MapPin, CheckCircle2 } from 'lucide-react';

export default function Hero() {
  return (
    <section id="inicio" className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-[#08040d]">
      {/* Subtle architectural grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      
      {/* Subtle top spotlight (refined, not blurry AI blob) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-72 bg-gradient-to-b from-[#371859]/30 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center z-10">

        {/* Official LLA Crest / Logo */}
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 my-1 drop-shadow-[0_10px_30px_rgba(55,24,89,0.5)] transition-transform duration-300 hover:scale-105">
          <Image
            src="/img/logo.png"
            alt="La Libertad Avanza Almirante Brown"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Main Title - Monumental & Editorial */}
        <h1 className="mt-6 text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white uppercase leading-[1.1] max-w-4xl">
          La fuerza de la libertad en cada rincón de Brown
        </h1>

        {/* Official Campaign Tagline */}
        <div className="mt-3">
          <span className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">
            #TuVozConstruye
          </span>
        </div>

        {/* Subtitle */}
        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
          Presencia territorial activa, escucha vecinal constante y proyectos legislativos reales de baja de tasas, orden y transparencia en el Honorable Concejo Deliberante.
        </p>

        {/* Action Buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://wa.me/5491171682115?text=Hola%20quiero%20sumarme%20a%20La%20Libertad%20Avanza%20Brown"
            target="_blank"
            rel="noopener noreferrer"
            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-700 via-purple-600 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-xl shadow-purple-900/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 group"
          >
            <span>Sumate al cambio</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>

          <a
            href="#mapa"
            className="px-6 py-3.5 rounded-xl border border-white/15 bg-[#120722]/80 hover:bg-[#180a2e] text-slate-200 hover:text-white font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Mapa Territorial y Obras</span>
          </a>
        </div>

        {/* Stats Row - Clean Editorial Metrics */}
        <div className="mt-16 w-full grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl">
          <div className="p-5 rounded-2xl bg-[#0e061a] border border-white/[0.08] flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 tabular-nums">13</span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">
              Localidades
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e061a] border border-white/[0.08] flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">8</span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">
              Concejales en HCD
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e061a] border border-white/[0.08] flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-black text-amber-400 tabular-nums">4</span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">
              Consejeros Escolares
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-[#0e061a] border border-white/[0.08] flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-black text-white tabular-nums">11</span>
            <span className="text-[11px] sm:text-xs font-bold text-slate-300 mt-1 uppercase tracking-wider">
              Circuitos Electorales
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
