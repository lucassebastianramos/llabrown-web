'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');

  const navLinks = [
    { id: 'inicio', label: 'Inicio', href: '#inicio', external: false },
    { id: 'nacion', label: 'Nación', href: '#nacion', external: false },
    { id: 'mapa', label: 'Mapa', href: '#mapa', external: false },
    { id: 'reclamos', label: 'Reclamos', href: '#reclamos', external: false },
    { id: 'expedientes', label: 'Expedientes', href: '/expedientes', external: true },
    { id: 'equipo', label: 'Equipo', href: '#equipo', external: false },
    { id: 'contacto', label: 'Contacto', href: '#contacto', external: false },
  ];

  useEffect(() => {
    const sectionIds = ['inicio', 'nacion', 'mapa', 'reclamos', 'territorio', 'equipo', 'contacto'];
    const handleScroll = () => {
      setScrolled(window.scrollY > 12);

      const scrollPosition = window.scrollY + 140;
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-[#371859] transition-shadow duration-200 ${
        scrolled ? 'shadow-lg border-b border-white/10' : 'border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-20">
          <Link href="#inicio" className="flex items-center shrink-0" aria-label="La Libertad Avanza Almirante Brown">
            <div className="relative w-44 sm:w-52 h-14 overflow-hidden">
              <Image
                src="/img/logo.png"
                alt="La Libertad Avanza Almirante Brown"
                fill
                className="object-contain object-[50%_40%] scale-[1.55]"
                priority
              />
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              if (link.external) {
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    className="relative py-1.5 text-sm font-semibold text-white/85 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                );
              }
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`relative py-1.5 text-sm font-semibold transition-colors ${
                    isActive ? 'text-white' : 'text-white/80 hover:text-white'
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
                  )}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href="/fiscalizacion"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-bold text-sm transition-colors shadow-sm"
            >
              Fiscalización
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#2f0163] border-t border-white/10 px-5 pt-3 pb-6 space-y-3 shadow-xl animate-fadeIn">
          <div className="flex flex-col divide-y divide-white/10">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              if (link.external) {
                return (
                  <Link
                    key={link.id}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-3 text-sm font-semibold flex items-center justify-between text-white/90 hover:text-white"
                  >
                    <span>{link.label}</span>
                    <span className="text-white/60">→</span>
                  </Link>
                );
              }
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 text-sm font-semibold flex items-center justify-between transition-colors ${
                    isActive ? 'text-white font-bold' : 'text-white/85 hover:text-white'
                  }`}
                >
                  <span>{link.label}</span>
                  <span className="text-white/60">→</span>
                </a>
              );
            })}
          </div>

          <div className="pt-2 grid grid-cols-1 gap-2">
            <a
              href="/fiscalizacion"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full justify-center px-5 py-3 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-bold text-sm flex items-center gap-2 shadow-sm"
            >
              Sistema de Fiscalización
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
