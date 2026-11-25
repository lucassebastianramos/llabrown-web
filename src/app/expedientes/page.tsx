import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BookOpen, ExternalLink, Search } from 'lucide-react';
import ProyectosSection from '@/components/ProyectosSection';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Expedientes y Proyectos HCD',
  description:
    'Consultá todos los proyectos de ordenanza y expedientes presentados por el bloque de concejales de La Libertad Avanza en el Honorable Concejo Deliberante de Almirante Brown.',
};

export default function ExpedientesPage() {
  return (
    <main className="min-h-screen bg-[#f5f4f8] text-[#1d1d1d] flex flex-col">
      {/* Cabecera institucional limpia */}
      <header className="bg-[#371859] text-white border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <Link href="/" className="relative w-44 sm:w-52 h-14 overflow-hidden block" aria-label="Volver al inicio">
            <Image
              src="/img/logo.png"
              alt="La Libertad Avanza Almirante Brown"
              fill
              className="object-contain object-[0%_40%] scale-[1.55] origin-left"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="/fiscalizacion"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg border border-white/30 hover:bg-white/10 text-white text-xs font-bold transition-colors"
            >
              Sistema de Fiscalización
            </a>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#371859] text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al inicio</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Banner de acceso al Digesto Oficial HCD */}
      <section className="bg-gradient-to-b from-[#371859] to-[#230552] text-white py-12 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-[#39b5e6] mb-3">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Honorable Concejo Deliberante · Almirante Brown</span>
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Expedientes y proyectos legislativos
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-white/85 leading-relaxed">
              Archivo público de proyectos de ordenanza, pedidos de informes y minutas presentadas por el bloque de La Libertad Avanza, con descarga en PDF y enlace directo al Digesto Oficial.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <a
              href="https://a.brown.gob.ar/hcd/digesto/buscarporpalabra"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[42px] px-4 py-2 rounded-lg border border-white/25 hover:bg-white/10 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3.5 h-3.5 text-[#39b5e6]" />
              <span>Buscar en Digesto</span>
              <ExternalLink className="w-3 h-3 text-white/70" />
            </a>
            <a
              href="https://a.brown.gob.ar/hcd/digesto"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[42px] px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#371859] text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
            >
              <span>Abrir Digesto Oficial HCD</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Listado completo filtrable de proyectos */}
      <div className="flex-1">
        <ProyectosSection />
      </div>

      <Footer />
    </main>
  );
}
