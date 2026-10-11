'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, ArrowUp, Instagram, Facebook, Twitter, MessageCircle } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#07030e] border-t border-purple-900/40 pt-16 pb-12 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-purple-900/40">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-purple-600/50 p-1 bg-purple-950/60">
                <Image
                  src="/img/logo.png"
                  alt="La Libertad Avanza"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-baseline gap-1 text-white">
                  <span className="font-medium text-xs sm:text-sm">LA</span>
                  <span className="font-extrabold text-sm sm:text-base tracking-tight">LIBERTAD</span>
                  <span className="font-semibold text-xs sm:text-sm">AVANZA</span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-purple-300 uppercase mt-0.5">
                  Almirante Brown
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Construyendo el cambio desde el territorio. Bloque de Concejales y Consejeros Escolares comprometidos con la transparencia, la baja de tasas y la libertad de los vecinos de Almirante Brown.
            </p>

            <div className="pt-2">
              <div className="inline-block px-3 py-1.5 rounded-lg bg-purple-950/60 border border-purple-800/60 text-xs font-semibold text-amber-300">
                Coordinación: Juan Pedro Aquino
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Navegación
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a href="#inicio" className="hover:text-amber-400 transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#territorio" className="hover:text-amber-400 transition-colors">
                  Territorio y Recorridas
                </a>
              </li>
              <li>
                <a href="#mapa" className="hover:text-amber-400 transition-colors">
                  Mapa Electoral & Localidades
                </a>
              </li>
              <li>
                <a href="#proyectos" className="hover:text-amber-400 transition-colors">
                  Proyectos HCD
                </a>
              </li>
              <li>
                <a href="#equipo" className="hover:text-amber-400 transition-colors">
                  Equipo de Concejales
                </a>
              </li>
              <li>
                <a href="#interactivo" className="hover:text-amber-400 transition-colors">
                  #TuVozConstruye (Interactivo)
                </a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-amber-400 transition-colors">
                  Sumate / Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Socials & Admin */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4">
              Seguinos en Redes
            </h4>
            <div className="flex flex-wrap gap-2 mb-6">
              <a
                href="https://www.instagram.com/lalibertadavanza_altebrownok?igsh=OGJsNTlpMWlrM2I2"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-pink-600/30 hover:border-pink-500/60 transition-all"
                aria-label="Instagram LLA Brown"
              >
                <Instagram className="w-4 h-4" />
              </a>

              <a
                href="https://www.facebook.com/lalibertadavanzaaltebrown"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-blue-600/30 hover:border-blue-500/60 transition-all"
                aria-label="Facebook LLA Brown"
              >
                <Facebook className="w-4 h-4" />
              </a>

              <a
                href="https://wa.me/5491167218190"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-purple-950/60 border border-purple-800/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-emerald-600/30 hover:border-emerald-500/60 transition-all"
                aria-label="WhatsApp LLA Brown"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-800/80 bg-purple-950/40 text-purple-200 text-xs font-semibold hover:bg-purple-900/60 transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Acceso Administrador / Concejales</span>
            </Link>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span>© 2025-2026 La Libertad Avanza – Almirante Brown.</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-amber-400/90 font-bold">
              Coordinación: Juan Pedro Aquino
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-purple-950/60 border border-purple-800/60 hover:text-white transition-colors"
              aria-label="Volver arriba"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
