'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight, MessageCircle } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');

  const navLinks = [
    { id: 'inicio', label: 'Inicio', href: '#inicio' },
    { id: 'mapa', label: 'Mapa', href: '#mapa' },
    { id: 'reclamos', label: 'Reclamos', href: '#reclamos' },
    { id: 'territorio', label: 'Territorio', href: '#territorio' },
    { id: 'proyectos', label: 'Proyectos', href: '#proyectos' },
    { id: 'equipo', label: 'Equipo', href: '#equipo' },
    { id: 'contacto', label: 'Contacto', href: '#contacto' },
  ];

  useEffect(() => {
    const sectionIds = ['inicio', 'mapa', 'reclamos', 'territorio', 'proyectos', 'equipo', 'contacto'];
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

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

  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#08040d]/90 backdrop-blur-xl border-b border-purple-900/30 shadow-2xl py-2.5 sm:py-3'
          : 'bg-[#08040d]/40 backdrop-blur-md border-b border-white/[0.06] py-3.5 sm:py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-12">
          
          {/* Brand - Left */}
          <Link href="#inicio" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl border border-white/10 bg-[#120722] p-1.5 group-hover:border-amber-400/60 transition-colors shadow-md">
              <Image
                src="/img/logo.png"
                alt="La Libertad Avanza"
                fill
                className="object-contain p-0.5"
                priority
              />
            </div>
            <div className="flex flex-col leading-none">
              <div className="flex items-baseline gap-1 text-white group-hover:text-amber-400 transition-colors">
                <span className="font-medium text-xs">LA</span>
                <span className="font-extrabold text-sm sm:text-base tracking-tight">LIBERTAD</span>
                <span className="font-semibold text-xs">AVANZA</span>
              </div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-purple-300 uppercase mt-0.5">
                Almirante Brown
              </span>
            </div>
          </Link>

          {/* Desktop Nav - Center Glass Capsule (Visible from lg: 1024px+) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-inner">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all duration-200 relative ${
                    isActive
                      ? 'text-amber-300 bg-white/[0.08] shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-[2px] bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Right Action: CTA & Mobile Hamburger */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Primary Action Button */}
            <a
              href="https://wa.me/5491131596936?text=Hola%20quiero%20sumarme%20a%20La%20Libertad%20Avanza%20Brown"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-700 via-purple-600 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-purple-900/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5 text-amber-300 fill-amber-300/20" />
              <span>Sumate al Equipo</span>
            </a>

            {/* Mobile menu toggle (Visible on < lg) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl bg-[#140a25] border border-white/10 text-slate-200 hover:text-white hover:border-amber-400/40 transition-colors"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#08040d]/98 border-b border-purple-900/30 px-5 pt-4 pb-6 space-y-4 shadow-2xl backdrop-blur-2xl animate-fadeIn">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                    isActive
                      ? 'bg-purple-950/60 border border-amber-400/30 text-amber-300 font-bold'
                      : 'text-slate-200 hover:bg-white/[0.06] hover:text-amber-400'
                  }`}
                >
                  <span>{link.label}</span>
                  <span className={isActive ? 'text-amber-400' : 'text-slate-600'}>→</span>
                </a>
              );
            })}
          </div>

          <div className="pt-3 border-t border-white/10">
            <a
              href="https://wa.me/5491131596936?text=Hola%20quiero%20sumarme%20a%20La%20Libertad%20Avanza%20Brown"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-700 via-purple-600 to-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg"
            >
              <MessageCircle className="w-4 h-4 text-amber-300" />
              <span>Sumate al equipo de Brown</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
