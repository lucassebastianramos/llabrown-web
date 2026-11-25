'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowUp, Instagram, Facebook, MessageCircle } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer>
      {/* Franja blanca superior de redes — estilo oficial LLA Nacional */}
      <div className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-base font-bold text-[#1d1d1d]">
            Seguinos en nuestras redes
          </span>

          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/lalibertadavanza_altebrownok"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#371859] hover:bg-[#230552] text-white flex items-center justify-center transition-colors"
              aria-label="Instagram La Libertad Avanza Almirante Brown"
            >
              <Instagram className="w-5 h-5" />
            </a>

            <a
              href="https://www.facebook.com/lalibertadavanzaaltebrown"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#371859] hover:bg-[#230552] text-white flex items-center justify-center transition-colors"
              aria-label="Facebook La Libertad Avanza Almirante Brown"
            >
              <Facebook className="w-5 h-5" />
            </a>

            <a
              href="https://wa.me/5491131596936"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-[#371859] hover:bg-[#230552] text-white flex items-center justify-center transition-colors"
              aria-label="WhatsApp Oficial La Libertad Avanza Almirante Brown"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>

      {/* Pie institucional violeta Pantone 2627 C (#371859) */}
      <div className="bg-[#371859] text-white pt-14 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-10 border-b border-white/15">
            {/* Marca y descripción */}
            <div className="md:col-span-5 space-y-4">
              <div className="relative w-48 h-14 overflow-hidden">
                <Image
                  src="/img/logo.png"
                  alt="La Libertad Avanza Almirante Brown"
                  fill
                  className="object-contain object-[0%_40%] scale-[1.55] origin-left"
                />
              </div>

              <p className="text-sm text-white/80 max-w-md leading-relaxed">
                Bloque de Concejales y Consejeros Escolares comprometidos con las ideas de la libertad, la baja de tasas y la transparencia municipal en cada localidad de Almirante Brown.
              </p>

              <p className="text-xs font-semibold text-white/90">
                Coordinación distrital: Juan Pedro Aquino
              </p>
            </div>

            {/* Navegación */}
            <div className="md:col-span-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">
                Secciones
              </h4>
              <ul className="grid grid-cols-2 gap-2.5 text-sm text-white/85">
                <li>
                  <a href="#inicio" className="hover:text-white hover:underline underline-offset-4">
                    Inicio
                  </a>
                </li>
                <li>
                  <a href="#nacion" className="hover:text-white hover:underline underline-offset-4">
                    Nación y Provincia
                  </a>
                </li>
                <li>
                  <a href="#mapa" className="hover:text-white hover:underline underline-offset-4">
                    Mapa Territorial
                  </a>
                </li>
                <li>
                  <a href="#reclamos" className="hover:text-white hover:underline underline-offset-4">
                    Reclamos Vecinales
                  </a>
                </li>
                <li>
                  <a href="#territorio" className="hover:text-white hover:underline underline-offset-4">
                    Territorio
                  </a>
                </li>
                <li>
                  <a href="#proyectos" className="hover:text-white hover:underline underline-offset-4">
                    Proyectos HCD
                  </a>
                </li>
                <li>
                  <a href="#equipo" className="hover:text-white hover:underline underline-offset-4">
                    Equipo y Legisladores
                  </a>
                </li>
                <li>
                  <a href="/f/fiscalizacion" className="hover:text-white hover:underline underline-offset-4">
                    Fiscalización
                  </a>
                </li>
                <li>
                  <a href="#contacto" className="hover:text-white hover:underline underline-offset-4">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="/admin" className="text-white/70 hover:text-white hover:underline underline-offset-4">
                    Portal Concejales
                  </a>
                </li>
              </ul>
            </div>

            {/* Atención Institucional */}
            <div className="md:col-span-3 space-y-3 text-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/70 mb-4">
                Sede y Atención
              </h4>
              <p className="text-white/90">
                <strong className="font-semibold text-white block">Sede Central</strong>
                Humberto Primo 990, Burzaco
              </p>
              <p className="text-white/90">
                <strong className="font-semibold text-white block">WhatsApp Oficial</strong>
                <a
                  href="https://wa.me/5491131596936"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-4"
                >
                  11 3159-6936
                </a>
              </p>
              <p className="text-white/90">
                <strong className="font-semibold text-white block">Correo Institucional</strong>
                <a
                  href="mailto:lalibertadavanza@llabrown.com.ar"
                  className="hover:underline underline-offset-4 break-all"
                >
                  lalibertadavanza@llabrown.com.ar
                </a>
              </p>
              <p className="pt-1">
                <a
                  href="https://a.brown.gob.ar/hcd/digesto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#39b5e6] hover:text-white underline underline-offset-4 transition-colors"
                >
                  Digesto Oficial HCD Brown →
                </a>
              </p>
            </div>
          </div>

          {/* Barra inferior */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/75">
            <span>© 2025–2026 La Libertad Avanza · Almirante Brown.</span>

            <button
              onClick={scrollToTop}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
              aria-label="Volver arriba"
            >
              <span>Subir</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
