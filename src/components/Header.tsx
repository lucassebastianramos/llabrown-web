'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Pines en Calles', href: '#mapa' },
    { label: 'Recorrido', href: '#interactivo' },
    { label: 'Territorio', href: '#territorio' },
    { label: 'Proyectos HCD', href: '#proyectos' },
    { label: 'Equipo', href: '#equipo' },
    { label: 'Contacto', href: '#contacto' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#08040d]/95 backdrop-blur-md border-b border-white/[0.08] shadow-2xl py-3.5'
          : 'bg-transparent py-5'
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

          {/* Desktop Nav - Center (Visible on xl+ to guarantee zero overlap) */}
          <nav className="hidden xl:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs uppercase tracking-wider font-semibold text-slate-300 hover:text-white transition-colors relative py-1.5 group"
              >
                <span>{link.label}</span>
                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-amber-400 transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Public Action - Right */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            <a
              href="https://wa.me/5491171682115?text=Hola%20quiero%20sumarme%20a%20La%20Libertad%20Avanza%20Brown"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-700 via-purple-600 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white shadow-lg shadow-purple-900/30 hover:shadow-purple-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span>Sumate al Equipo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Mobile menu toggle (Visible on < xl) */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2.5 rounded-xl bg-[#140a25] border border-white/10 text-slate-200 hover:text-white transition-colors"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Zero overlap, full overlay dropdown) */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#08040d]/98 border-b border-white/10 px-5 pt-4 pb-6 space-y-4 shadow-2xl backdrop-blur-2xl animate-fadeIn">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3.5 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:bg-white/[0.06] hover:text-amber-400 transition-all flex items-center justify-between"
              >
                <span>{link.label}</span>
                <span className="text-slate-600">→</span>
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10">
            <a
              href="https://wa.me/5491171682115?text=Hola%20quiero%20sumarme%20a%20La%20Libertad%20Avanza%20Brown"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full justify-center px-4 py-3 rounded-xl bg-gradient-to-r from-purple-700 to-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg"
            >
              <span>Sumate al equipo de Brown</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
