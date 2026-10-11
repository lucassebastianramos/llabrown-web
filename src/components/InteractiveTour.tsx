'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import confetti from 'canvas-confetti';
import { LOCALIDADES } from '@/data/mockData';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Share2, 
  Check, 
  Sparkles, 
  MapPin, 
  Award,
  Send,
  Copy
} from 'lucide-react';

export default function InteractiveTour() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSteps = LOCALIDADES.length; // 12 localities + 1 final slide = index 0 to 12
  const isFinalSlide = currentIndex === totalSteps;

  // Autoplay effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => {
        if (currentIndex < totalSteps) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          setIsPlaying(false);
        }
      }, 3500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentIndex, totalSteps]);

  // Trigger confetti on final slide
  useEffect(() => {
    if (isFinalSlide) {
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#7c3aed', '#fbbf24', '#f59e0b', '#a78bfa', '#ffffff']
        });
      } catch (e) {
        // Safe fallback if confetti isn't available
      }
    }
  }, [isFinalSlide]);

  const handleNext = () => {
    if (currentIndex < totalSteps) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsPlaying(false);
  };

  const shareText = `🇦🇷 #TuVozConstruye en las 12 localidades de Almirante Brown!\n\nConocé los proyectos y visitas de La Libertad Avanza en cada barrio.\n\n🏛️ Coordinación: Juan Pedro Aquino\n🔗 Visitá: https://llabrown.com.ar`;

  const copyShareText = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const currentLoc = currentIndex < totalSteps ? LOCALIDADES[currentIndex] : null;

  return (
    <section id="interactivo" className="py-20 relative overflow-hidden bg-gradient-to-b from-[#0b0614] via-[#120722] to-[#0b0614]">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-900/20 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Experiencia Interactiva para Redes</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Recorrido por las <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">12 Localidades</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base max-w-xl mx-auto">
            Explorá el compromiso territorial de La Libertad Avanza localidad por localidad, culminando con la placa oficial de #TuVozConstruye.
          </p>
        </div>

        {/* Story / Tour Card Container */}
        <div className="relative rounded-3xl glass-panel border border-purple-500/30 overflow-hidden shadow-2xl p-6 sm:p-10 transition-all duration-500 min-h-[500px] flex flex-col justify-between">
          
          {/* Top Progress Bars (Story style) */}
          <div className="w-full flex gap-1.5 mb-6">
            {Array.from({ length: totalSteps + 1 }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsPlaying(false);
                }}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  idx < currentIndex
                    ? 'bg-amber-400'
                    : idx === currentIndex
                    ? 'bg-purple-400 shadow-[0_0_8px_#a78bfa]'
                    : 'bg-slate-700/60'
                }`}
                title={`Paso ${idx + 1}`}
              />
            ))}
          </div>

          {/* Slide Content */}
          {!isFinalSlide && currentLoc && (
            <div className="flex-1 flex flex-col justify-center animate-fadeIn">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  Localidad {currentIndex + 1} de {totalSteps}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-900/60 border border-purple-700/50 text-purple-200">
                  Circuito {currentLoc.circuito}
                </span>
              </div>

              <h3 className="text-3xl sm:text-4xl font-black text-white mb-3">
                {currentLoc.nombre}
              </h3>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
                {currentLoc.descripcion}
              </p>

              {/* Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Puntos de Referencia
                  </span>
                  <p className="text-xs text-slate-200">
                    {currentLoc.hitos.join(' · ')}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/40">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300 block mb-1">
                    Acción Territorial Activa
                  </span>
                  <p className="text-xs text-slate-200">
                    {currentLoc.destacado}
                  </p>
                </div>
              </div>

              {/* Local Contact preview */}
              <div className="mt-4 pt-4 border-t border-purple-900/40 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Referente: <strong className="text-white">{currentLoc.referenteNombre}</strong>
                </span>
                <a
                  href={currentLoc.wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  Contactar por WhatsApp →
                </a>
              </div>
            </div>
          )}

          {/* FINAL SLIDE: PLACA TU VOZ CONSTRUYE & JUAN PEDRO AQUINO */}
          {isFinalSlide && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 sm:p-8 animate-fadeIn">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 mb-4">
                <Image
                  src="/img/logo.png"
                  alt="La Libertad Avanza"
                  fill
                  className="object-contain drop-shadow-[0_0_25px_rgba(251,191,36,0.5)]"
                />
              </div>

              {/* Plaque container styled for social media export */}
              <div className="w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#1c0d38] via-[#150a2b] to-[#0e061c] border-2 border-amber-400/80 shadow-[0_0_40px_rgba(251,191,36,0.25)] relative">
                <span className="inline-block text-xs font-extrabold tracking-widest text-purple-300 uppercase mb-2">
                  LA LIBERTAD AVANZA · ALMIRANTE BROWN
                </span>

                <h3 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-3">
                  <span className="text-amber-400">#Tu voz</span> construye
                </h3>

                <p className="text-slate-200 text-sm sm:text-base font-medium mb-6 leading-relaxed">
                  Presentes en Adrogué, Burzaco, Claypole, Don Orione, Glew, José Mármol, Longchamps, Malvinas Argentinas, Ministro Rivadavia, Rafael Calzada, San Francisco de Asís y Solano.
                </p>

                {/* Coordination Plaque requested */}
                <div className="pt-4 border-t border-amber-400/30 flex flex-col items-center">
                  <span className="text-xs text-amber-300/80 uppercase tracking-widest font-bold">
                    Coordinación
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-white tracking-wide mt-0.5">
                    Juan Pedro Aquino
                  </span>
                  <span className="text-xs text-purple-300 font-semibold mt-0.5">
                    Jefe de Bloque de Concejales · Almirante Brown
                  </span>
                </div>
              </div>

              {/* Share & Copy actions for social media */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={copyShareText}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '¡Copiado para Redes!' : 'Copiar Texto para Redes'}</span>
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>Compartir en WhatsApp</span>
                </a>

                <button
                  onClick={handleRestart}
                  className="px-4 py-2.5 rounded-xl border border-purple-800 bg-purple-950/60 hover:bg-purple-900/60 text-slate-300 font-semibold text-xs flex items-center gap-2 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls Bar */}
          <div className="mt-8 pt-4 border-t border-purple-900/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isPlaying
                    ? 'bg-amber-400 text-purple-950 border-amber-300'
                    : 'bg-purple-950/60 border-purple-800 text-slate-200 hover:text-white'
                }`}
                title={isPlaying ? 'Pausar recorrido' : 'Reproducir modo historia'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {isPlaying ? 'Pausar' : 'Modo Historia'}
                </span>
              </button>

              <button
                onClick={handleRestart}
                className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800 text-slate-300 hover:text-white transition-all"
                title="Volver al inicio"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="p-2.5 rounded-xl bg-purple-950/60 border border-purple-800 text-slate-200 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                aria-label="Anterior localidad"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                disabled={isFinalSlide}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-600/20"
              >
                <span>{currentIndex === totalSteps - 1 ? 'Ver Placa Final' : 'Siguiente'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
