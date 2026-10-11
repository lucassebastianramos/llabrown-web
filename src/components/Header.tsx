'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Shield, ArrowRight, Sparkles } from 'lucide-react';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Territorio', href: '#territorio' },
    { label: 'Mapa Electoral', href: '#mapa' },
    { label: 'Proyectos HCD', href: '#proyectos' },
    { label: 'Equipo', href: '#equipo' },
    { label: '#TuVozConstruye', href: '#interactivo', badge: 'Interactivo' },
    { label: 'Contacto', href: '#contacto' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0d0617]/90 backdrop-blur-md border-b border-purple-900/40 py-3 shadow-2xl'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand */}
        <Link href="#inicio" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 overflow-hidden rounded-lg border border-purple-500/40 bg-purple-950/40 p-1 group-hover:border-amber-400 transition-colors">
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
              <span className="font-medium text-xs sm:text-sm">LA</span>
              <span className="font-extrabold text-sm sm:text-base tracking-tight">LIBERTAD</span>
              <span className="font-semibold text-xs sm:text-sm">AVANZA</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold tracking-widest text-purple-300 uppercase mt-0.5">
              Almirante Brown
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-xs uppercase tracking-wider font-semibold text-slate-300 hover:text-white transition-colors relative py-1 group flex items-center gap-1"
            >
              <span>{link.label}</span>
              {link.badge && (
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                  {link.badge}
                </span>
              )}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/admin"
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-purple-800/80 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 transition-all flex items-center gap-1.5"
            title="Portal Concejales y Gestión"
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Portal Concejales</span>
          </Link>

          <a
            href="https://wa.me/5491171682115?text=Hola%20quiero%20sumarme"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 via-purple-700 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <span>Sumate</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg bg-purple-950/60 border border-purple-800/60 text-slate-200 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0e071c]/98 border-b border-purple-900/60 px-4 pt-4 pb-6 space-y-3 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-200 hover:bg-purple-900/40 hover:text-amber-400 transition-all flex items-center justify-between"
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="bg-amber-400/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40">
                    {link.badge}
                  </span>
                )}
              </a>
            ))}
          </div>

          <div className="pt-3 border-t border-purple-900/40 flex flex-col gap-2">
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full justify-center px-4 py-2.5 rounded-lg border border-purple-800 bg-purple-950/70 text-purple-200 text-xs font-semibold flex items-center gap-2"
            >
              <Shield className="w-4 h-4 text-amber-400" />
              <span>Portal Concejales</span>
            </Link>

            <a
              href="https://wa.me/5491171682115?text=Hola%20quiero%20sumarme"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full justify-center px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg"
            >
              <span>Sumate al equipo</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
