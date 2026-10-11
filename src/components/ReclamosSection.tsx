'use client';

import React, { useState, useEffect } from 'react';
import { LOCALIDADES } from '@/data/mockData';
import { LocalidadNombre, ReclamoVecinal } from '@/types';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  ExternalLink, 
  Search, 
  BookOpen, 
  Scale, 
  AlertCircle, 
  ShieldCheck, 
  PhoneCall, 
  MapPin, 
  Building2, 
  Layers,
  Sparkles,
  MessageCircle,
  HelpCircle
} from 'lucide-react';
import { buildWhatsAppReclamoUrl } from '@/lib/municipalReclamoService';

export default function ReclamosSection() {
  const [localidad, setLocalidad] = useState<LocalidadNombre>('Burzaco');
  const [barrio, setBarrio] = useState<string>('');
  const [calle, setCalle] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [entreCalles, setEntreCalles] = useState<string>('');
  const [tipoReclamo, setTipoReclamo] = useState<string>('Vía Pública / Bacheo de Calles');
  const [descripcion, setDescripcion] = useState<string>('');
  const [nombreVecino, setNombreVecino] = useState<string>('');
  const [telefonoVecino, setTelefonoVecino] = useState<string>('');
  const [dniVecino, setDniVecino] = useState<string>('');
  const [normaDigesto, setNormaDigesto] = useState<string>('');

  const [barriosList, setBarriosList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReclamo, setSubmittedReclamo] = useState<ReclamoVecinal | null>(null);
  const [resultadoMsg, setResultadoMsg] = useState<string>('');
  const [showDigestoGuide, setShowDigestoGuide] = useState(false);

  // Cargar barrios oficiales de la localidad seleccionada desde almirante-brown-barrios.json
  useEffect(() => {
    fetch('/data/almirante-brown-barrios.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.features) {
          const barrios = data.features
            .filter((f: any) => f.properties?.localidad?.toLowerCase() === localidad.toLowerCase())
            .map((f: any) => f.properties?.nombre as string)
            .filter(Boolean)
            .sort();
          setBarriosList(barrios);
          if (barrios.length > 0 && !barrios.includes(barrio)) {
            setBarrio(barrios[0]);
          }
        }
      })
      .catch(() => {});
  }, [localidad]);

  const TIPOS_RECLAMO = [
    'Vía Pública / Bacheo de Calles',
    'Vía Pública / Arreglo de Calles (Tierra/Zanjeo)',
    'Luminarias (Rotas, apagadas o cables expuestos)',
    'Higiene Urbana / Basurales a cielo abierto',
    'Retiro de Residuos / Poda y Escombros',
    'Tasas Municipales (Cobros abusivos / reclamo)',
    'Tránsito / Seguridad Vial (Semáforos, lomadas)',
    'Ambiente / Aguas Servidas y Cloacas',
    'Mobiliario Urbano en Plazas y Vía Pública',
    'Servicios de Salud / Reclamo en CAPS',
    'Inspección / Habilitaciones Comerciales',
    'Defensa Civil / Seguridad Barrial'
  ];

  const NORMAS_SUGERIDAS = [
    {
      titulo: 'Ordenanza N° 13.906',
      detalle: 'Delimitación y Denominación Oficial de los 176 Barrios de Almirante Brown.',
    },
    {
      titulo: 'Ordenanza Fiscal e Impositiva',
      detalle: 'Tasa por Servicios Generales (Conservación, Alumbrado y Limpieza de la Vía Pública).',
    },
    {
      titulo: 'Reglamento de Tránsito y Obras',
      detalle: 'Obligación municipal de señalización, bacheo y accesibilidad peatonal segura.',
    },
    {
      titulo: 'Higiene Urbana y Medio Ambiente',
      detalle: 'Prohibición de microbasurales y mantenimiento de zanjas y desagües pluviales.',
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calle.trim() || !descripcion.trim() || !nombreVecino.trim() || !telefonoVecino.trim()) {
      alert('Por favor completá los campos obligatorios: calle, descripción, nombre y teléfono.');
      return;
    }

    setIsSubmitting(true);
    setResultadoMsg('');

    try {
      const res = await fetch('/api/reclamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreVecino,
          telefonoVecino,
          dniVecino,
          localidad,
          barrio,
          calle,
          altura,
          entreCalles,
          tipoReclamo,
          descripcion,
          normaDigesto,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reclamo) {
        setSubmittedReclamo(data.reclamo);
        setResultadoMsg(data.resultadoMunicipal?.mensaje || 'Reclamo registrado exitosamente.');
      } else {
        alert(data.error || 'Ocurrió un error al procesar tu reclamo.');
      }
    } catch (err) {
      alert('Error de conexión. Podés enviarnos tu reclamo directamente por WhatsApp al 11 3159-6936.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmittedReclamo(null);
    setCalle('');
    setAltura('');
    setEntreCalles('');
    setDescripcion('');
    setNormaDigesto('');
  };

  return (
    <section id="reclamos" className="py-20 relative bg-[#08040d] border-t border-purple-950/40">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-purple-950/20 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 shadow-sm">
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>Auditoría Ciudadana & Bloque HCD</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight uppercase">
            Cargar Reclamo <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500">Vecinal</span>
          </h2>

          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            Canalizá tu reclamo con el bloque de concejales de <strong>La Libertad Avanza</strong>. 
            Registramos tu solicitud en nuestra base de datos, ingresamos formalmente el trámite 
            bajo el patrocinio del Concejal <strong>Juan Pedro Aquino</strong> y 
            te entregamos tu número de reclamo para auditar la respuesta del municipio.
          </p>
        </div>

        {/* Digesto Municipal HCD Integration Bar */}
        <div className="mb-10 p-6 rounded-3xl bg-[#0f071b] border border-amber-400/25 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-purple-900/40 border border-purple-700/60 text-amber-400 shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">
                    Digesto Oficial del Honorable Concejo Deliberante
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/40">
                    Oficial
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Todo reclamo vecinal tiene sustento en las ordenanzas y decretos municipales vigentes que el gobierno de Brown debe cumplir. Podés buscar y fundamentar tu solicitud directamente en el portal oficial del HCD.
                </p>
              </div>
            </div>

            {/* Direct links to Digesto tools */}
            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto">
              <a
                href="https://a.brown.gob.ar/hcd/digesto/buscarporpalabra"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/60 text-white hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Search className="w-3.5 h-3.5 text-amber-400" />
                <span>Por Palabra Clave</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href="https://a.brown.gob.ar/hcd/digesto/buscarpornumero"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-purple-950/70 hover:bg-purple-900/80 border border-purple-700/60 text-white hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Por N° de Norma</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              <a
                href="https://a.brown.gob.ar/hcd/digesto"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
              >
                <span>Ver Digesto HCD</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Main Grid: Form / Success Card + Audit Info */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Form or Success Card (8 cols) */}
          <div className="lg:col-span-8">
            {submittedReclamo ? (
              /* Success & Tracking State */
              <div className="p-8 rounded-3xl bg-[#0f071b] border border-amber-400/40 shadow-2xl animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 block">
                      Reclamo Registrado en Auditoría LLA
                    </span>
                    <h3 className="text-2xl font-black text-white">
                      ¡Tu reclamo está en marcha!
                    </h3>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-[#140a25] border border-purple-800/60 mb-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-900/50">
                    <span className="text-xs text-slate-400">Código de Seguimiento LLA:</span>
                    <span className="text-sm font-mono font-black text-amber-400 bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-700/60">
                      {submittedReclamo.codigoSeguimiento}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-900/50">
                    <span className="text-xs text-slate-400">Patrocinio Institucional:</span>
                    <span className="text-xs font-bold text-white">
                      {submittedReclamo.patrocinadoPor}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-900/50">
                    <span className="text-xs text-slate-400">Ubicación:</span>
                    <span className="text-xs font-semibold text-slate-200">
                      {submittedReclamo.calle} {submittedReclamo.altura || ''} · {submittedReclamo.barrio ? `${submittedReclamo.barrio}, ` : ''}{submittedReclamo.localidad}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-400">Estado en Sistema Municipal:</span>
                    <span className="text-xs font-bold text-purple-300">
                      {submittedReclamo.numeroReclamoMunicipal 
                        ? `Ingresado - N° Oficial: ${submittedReclamo.numeroReclamoMunicipal}` 
                        : 'Enviado a BrownGestión / En Auditoría de Bloque'}
                    </span>
                  </div>
                </div>

                {resultadoMsg && (
                  <p className="text-xs text-slate-300 mb-6 bg-purple-950/40 p-3.5 rounded-xl border border-purple-800/40">
                    ℹ️ {resultadoMsg}
                  </p>
                )}

                {/* Actions: WhatsApp + Ver Mapa + Nuevo Reclamo */}
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={buildWhatsAppReclamoUrl(submittedReclamo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>Avisar al Concejal Pedro Aquino por WhatsApp</span>
                  </a>

                  <a
                    href="#mapa"
                    className="py-3 px-4 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-white border border-purple-700/60 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ver Mapa Territorial</span>
                  </a>

                  <button
                    onClick={handleReset}
                    className="py-3 px-4 rounded-xl bg-transparent hover:bg-white/[0.05] text-slate-300 hover:text-white text-xs font-semibold transition-all"
                  >
                    Cargar otro reclamo
                  </button>
                </div>
              </div>
            ) : (
              /* Claim Input Form */
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#0f071b] border border-white/[0.08] shadow-2xl space-y-6">
                
                <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                  <div>
                    <h3 className="text-xl font-bold text-white">Formulario de Solicitud Vecinal</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Completá los detalles para que el bloque de concejales lo gestione formalmente.</p>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-amber-400 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/30">
                    Paso 1 de 1
                  </span>
                </div>

                {/* 1. Localidad & Barrio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Localidad *
                    </label>
                    <select
                      value={localidad}
                      onChange={(e) => setLocalidad(e.target.value as LocalidadNombre)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    >
                      {LOCALIDADES.map((loc) => (
                        <option key={loc.id} value={loc.nombre} className="bg-[#140a25]">
                          {loc.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                      <span>Barrio Oficial (Ord. 13.906)</span>
                      <span className="text-[10px] text-amber-400">{barriosList.length} barrios</span>
                    </label>
                    <select
                      value={barrio}
                      onChange={(e) => setBarrio(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                    >
                      <option value="" className="bg-[#140a25]">Seleccionar Barrio...</option>
                      {barriosList.map((b) => (
                        <option key={b} value={b} className="bg-[#140a25]">
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Dirección: Calle, Altura y Esquina */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Calle Principal *
                    </label>
                    <input
                      type="text"
                      value={calle}
                      onChange={(e) => setCalle(e.target.value)}
                      placeholder="Ej: Humberto Primo, Amenedo, Salta..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Altura / N°
                    </label>
                    <input
                      type="text"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="Ej: 990 o S/N"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Entre Calles / Esquina
                    </label>
                    <input
                      type="text"
                      value={entreCalles}
                      onChange={(e) => setEntreCalles(e.target.value)}
                      placeholder="Ej: y Roca"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* 3. Tipo de Reclamo */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Categoría del Reclamo *
                  </label>
                  <select
                    value={tipoReclamo}
                    onChange={(e) => setTipoReclamo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400 transition-colors"
                    required
                  >
                    {TIPOS_RECLAMO.map((t) => (
                      <option key={t} value={t} className="bg-[#140a25]">
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Descripción del Problema */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Detalle del Reclamo *</span>
                    <span className="text-[10px] text-slate-400">Sé lo más específico posible</span>
                  </label>
                  <textarea
                    rows={4}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Contanos qué sucede: hace cuánto tiempo persiste el problema, si afecta el paso de ambulancias o colectivos, cables caídos, cráteres peligrosos o falta de respuesta previa del municipio..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    required
                  />
                </div>

                {/* 5. Cita del Digesto Oficial (Opcional) */}
                <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      Fundamento Legal en Digesto HCD (Opcional)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDigestoGuide(!showDigestoGuide)}
                      className="text-[11px] text-purple-300 hover:text-white underline transition-colors"
                    >
                      {showDigestoGuide ? 'Ocultar sugerencias' : 'Ver sugerencias rápidas'}
                    </button>
                  </div>

                  {showDigestoGuide && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px]">
                      {NORMAS_SUGERIDAS.map((norma) => (
                        <button
                          type="button"
                          key={norma.titulo}
                          onClick={() => setNormaDigesto(norma.titulo)}
                          className="p-2.5 rounded-xl bg-[#140a25] border border-purple-800/60 hover:border-amber-400 text-left transition-colors"
                        >
                          <strong className="text-amber-300 block">{norma.titulo}</strong>
                          <span className="text-slate-400 text-[10px]">{norma.detalle}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={normaDigesto}
                    onChange={(e) => setNormaDigesto(e.target.value)}
                    placeholder="Ej: Ordenanza 13.906 de Barrios / Ordenanza Fiscal de Alumbrado y Bacheo"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                {/* 6. Datos del Vecino */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Tu Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      value={nombreVecino}
                      onChange={(e) => setNombreVecino(e.target.value)}
                      placeholder="Ej: Martín Rodríguez"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Tu Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={telefonoVecino}
                      onChange={(e) => setTelefonoVecino(e.target.value)}
                      placeholder="Ej: 11 3159-6936"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      DNI (Opcional)
                    </label>
                    <input
                      type="text"
                      value={dniVecino}
                      onChange={(e) => setDniVecino(e.target.value)}
                      placeholder="Si no poseés, patrocina LLA"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#140a25] border border-purple-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Datos protegidos y auditados por el Bloque LLA</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-700 via-purple-600 to-amber-500 hover:from-purple-600 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-900/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar Reclamo para Auditoría</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Why audit with LLA / BrownGestión info (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Box 1: Institutional sponsorship */}
            <div className="p-6 rounded-3xl bg-[#0f071b] border border-purple-500/25 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-900/50 border border-purple-700 text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Auditoría Permanente
                  </h4>
                  <span className="text-[11px] text-amber-400 font-semibold block">
                    Coordinación Juan Pedro Aquino
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Cada reclamo vecinal no queda en el olvido. Los concejales de <strong>La Libertad Avanza</strong> cotejan los números de trámite en las sesiones del Concejo Deliberante para exigir la rendición de cuentas de las cuadrillas y el destino de las tasas municipales.
              </p>

              <div className="pt-3 border-t border-purple-900/40 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Teléfono / WhatsApp Oficial:</span>
                  <strong className="text-amber-400 font-bold">11 3159-6936</strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Sede Central:</span>
                  <span className="text-white">Humberto Primo 990, Burzaco</span>
                </div>
              </div>
            </div>

            {/* Box 2: Centralización Exclusiva y Transparencia */}
            <div className="p-6 rounded-3xl bg-[#0f071b] border border-white/[0.08] shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Centralización y Auditoría Directa</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Cada reclamo vecinal ingresado es resguardado en nuestra base de datos. Nuestro bloque legislativo tramita el ingreso formal ante las dependencias municipales y audita cada semana el estado de resolución en el HCD.
              </p>

              <a
                href="#mapa"
                className="w-full py-2.5 px-3 rounded-xl bg-purple-950/80 hover:bg-purple-900 text-white text-xs font-semibold flex items-center justify-between border border-purple-800/80 transition-colors group"
              >
                <span className="group-hover:text-amber-300 transition-colors">Explorar Reclamos en el Mapa</span>
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
              </a>
            </div>

            {/* Box 3: WhatsApp Direct Channel */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#1a0b2e] to-[#0e0417] border border-amber-400/30 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <MessageCircle className="w-4 h-4" />
                <span>¿Dudas o Reclamo Urgente?</span>
              </div>
              <p className="text-xs text-slate-300">
                Escribinos directamente por WhatsApp y nuestro equipo de coordinadores territoriales de tu localidad te asiste al instante.
              </p>
              <a
                href="https://wa.me/5491131596936?text=Hola%20Juan%20Pedro%2C%20tengo%20un%20reclamo%20vecinal%20urgente"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-purple-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Escribir al 11 3159-6936</span>
              </a>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
