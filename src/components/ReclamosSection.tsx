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
  ShieldCheck,
  MapPin,
  MessageCircle,
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
    'Defensa Civil / Seguridad Barrial',
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
    },
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
    <section id="reclamos" className="py-20 bg-[#371859] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado limpio estilo institucional */}
        <div className="max-w-3xl mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#39b5e6]">
            Auditoría Ciudadana · Bloque HCD
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Cargar reclamo vecinal
          </h2>
          <p className="mt-3 text-white/85 text-sm sm:text-base leading-relaxed">
            Canalizá tu solicitud con el bloque de concejales de <strong>La Libertad Avanza</strong>. Registramos tu reclamo en nuestra base de datos, ingresamos formalmente el trámite bajo el patrocinio del Concejal <strong>Juan Pedro Aquino</strong> y te entregamos tu número de seguimiento para auditar al municipio.
          </p>
        </div>

        {/* Barra de integración con Digesto Oficial HCD */}
        <div className="mb-10 p-6 rounded-2xl bg-[#230552] border border-white/15">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-white/10 text-white shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Digesto Oficial del Honorable Concejo Deliberante
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-bold uppercase tracking-wider">
                    Oficial
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-1 max-w-2xl leading-relaxed">
                  Todo reclamo vecinal tiene sustento en las ordenanzas y decretos municipales vigentes que el municipio de Almirante Brown debe cumplir. Podés consultar las normas directamente en el portal oficial del HCD.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto">
              <a
                href="https://a.brown.gob.ar/hcd/digesto/buscarporpalabra"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg border border-white/25 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[#39b5e6]" />
                <span>Por palabra clave</span>
                <ExternalLink className="w-3 h-3 text-white/70" />
              </a>

              <a
                href="https://a.brown.gob.ar/hcd/digesto/buscarpornumero"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg border border-white/25 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#39b5e6]" />
                <span>Por N° de norma</span>
                <ExternalLink className="w-3 h-3 text-white/70" />
              </a>

              <a
                href="https://a.brown.gob.ar/hcd/digesto"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#371859] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Ver Digesto HCD</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Grilla principal: Tarjeta blanca de formulario (estilo LLA Nacional) + Paneles de auditoría */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            {submittedReclamo ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-white text-[#1d1d1d] shadow-xl animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[#371859]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6c4c99] block">
                      Reclamo Registrado en Auditoría LLA
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#1d1d1d]">
                      Tu reclamo ya está en seguimiento
                    </h3>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 mb-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <span className="text-xs text-slate-600">Código de Seguimiento LLA:</span>
                    <span className="text-sm font-mono font-bold text-[#371859] bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                      {submittedReclamo.codigoSeguimiento}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <span className="text-xs text-slate-600">Patrocinio Institucional:</span>
                    <span className="text-xs font-bold text-slate-900">
                      {submittedReclamo.patrocinadoPor}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <span className="text-xs text-slate-600">Ubicación:</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {submittedReclamo.calle} {submittedReclamo.altura || ''} ·{' '}
                      {submittedReclamo.barrio ? `${submittedReclamo.barrio}, ` : ''}
                      {submittedReclamo.localidad}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-600">Estado en Sistema Municipal:</span>
                    <span className="text-xs font-bold text-[#371859]">
                      {submittedReclamo.numeroReclamoMunicipal
                        ? `Ingresado - N° Oficial: ${submittedReclamo.numeroReclamoMunicipal}`
                        : 'Enviado a Gestión Municipal · En Auditoría de Bloque'}
                    </span>
                  </div>
                </div>

                {resultadoMsg && (
                  <p className="text-xs text-slate-700 mb-6 bg-purple-50/70 p-3.5 rounded-xl border border-purple-200">
                    {resultadoMsg}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={buildWhatsAppReclamoUrl(submittedReclamo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>Avisar al Concejal Pedro Aquino por WhatsApp</span>
                  </a>

                  <a
                    href="#mapa"
                    className="py-3 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#371859]" />
                    <span>Ver Mapa</span>
                  </a>

                  <button
                    onClick={handleReset}
                    className="py-3 px-4 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
                  >
                    Cargar otro reclamo
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-6 sm:p-8 rounded-2xl bg-white text-[#1d1d1d] shadow-xl space-y-5"
              >
                <div className="pb-4 border-b border-slate-200">
                  <h3 className="text-xl font-extrabold text-[#1d1d1d]">
                    Formulario de solicitud vecinal
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Completá los datos para que nuestro bloque legislativo ingrese y audite tu reclamo.
                  </p>
                </div>

                {/* 1. Localidad & Barrio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Localidad *
                    </label>
                    <select
                      value={localidad}
                      onChange={(e) => setLocalidad(e.target.value as LocalidadNombre)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                      required
                    >
                      {LOCALIDADES.map((loc) => (
                        <option key={loc.id} value={loc.nombre}>
                          {loc.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Barrio Oficial (Ord. 13.906)</span>
                      <span className="text-[10px] font-semibold text-[#6c4c99]">
                        {barriosList.length} barrios
                      </span>
                    </label>
                    <select
                      value={barrio}
                      onChange={(e) => setBarrio(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    >
                      <option value="">Seleccionar barrio...</option>
                      {barriosList.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Dirección */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-6">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Calle principal *
                    </label>
                    <input
                      type="text"
                      value={calle}
                      onChange={(e) => setCalle(e.target.value)}
                      placeholder="Ej: Humberto Primo, Amenedo, Salta..."
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Altura / N°
                    </label>
                    <input
                      type="text"
                      value={altura}
                      onChange={(e) => setAltura(e.target.value)}
                      placeholder="Ej: 990 o S/N"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Entre calles / Esquina
                    </label>
                    <input
                      type="text"
                      value={entreCalles}
                      onChange={(e) => setEntreCalles(e.target.value)}
                      placeholder="Ej: y Roca"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* 3. Categoría */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Categoría del reclamo *
                  </label>
                  <select
                    value={tipoReclamo}
                    onChange={(e) => setTipoReclamo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    required
                  >
                    {TIPOS_RECLAMO.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Detalle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Detalle del problema *</span>
                    <span className="text-[10px] font-normal text-slate-500">
                      Sé lo más específico posible
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Contanos qué sucede: desde cuándo persiste el problema, si afecta el paso de ambulancias o colectivos, luminarias apagadas o falta de respuesta previa..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    required
                  />
                </div>

                {/* 5. Cita del Digesto (Opcional) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#371859] flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      Fundamento legal en Digesto HCD (Opcional)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDigestoGuide(!showDigestoGuide)}
                      className="text-[11px] font-semibold text-[#6c4c99] hover:text-[#371859] underline transition-colors"
                    >
                      {showDigestoGuide ? 'Ocultar sugerencias' : 'Ver sugerencias rápidas'}
                    </button>
                  </div>

                  {showDigestoGuide && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      {NORMAS_SUGERIDAS.map((norma) => (
                        <button
                          type="button"
                          key={norma.titulo}
                          onClick={() => setNormaDigesto(norma.titulo)}
                          className="p-2.5 rounded-lg bg-white border border-slate-200 hover:border-[#371859] text-left transition-colors"
                        >
                          <strong className="text-[#371859] block">{norma.titulo}</strong>
                          <span className="text-slate-600 text-[10px]">{norma.detalle}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    value={normaDigesto}
                    onChange={(e) => setNormaDigesto(e.target.value)}
                    placeholder="Ej: Ordenanza 13.906 de Barrios / Ordenanza Fiscal de Alumbrado y Bacheo"
                    className="w-full px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] transition-colors"
                  />
                </div>

                {/* 6. Datos del vecino */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nombre y apellido *
                    </label>
                    <input
                      type="text"
                      value={nombreVecino}
                      onChange={(e) => setNombreVecino(e.target.value)}
                      placeholder="Ej: Martín Rodríguez"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={telefonoVecino}
                      onChange={(e) => setTelefonoVecino(e.target.value)}
                      placeholder="Ej: 11 3159-6936"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      DNI (Opcional)
                    </label>
                    <input
                      type="text"
                      value={dniVecino}
                      onChange={(e) => setDniVecino(e.target.value)}
                      placeholder="Patrocina Bloque LLA"
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Botón de envío */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-[#371859] shrink-0" />
                    <span>Datos resguardados y auditados por el Bloque LLA</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Procesando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Enviar reclamo</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Columna Derecha: Información de auditoría institucional */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-6 rounded-2xl bg-[#230552] border border-white/15 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-white/10 text-[#39b5e6]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Auditoría Permanente</h4>
                  <span className="text-xs text-white/75 block">
                    Coordinación Juan Pedro Aquino
                  </span>
                </div>
              </div>

              <p className="text-xs text-white/80 leading-relaxed">
                Cada solicitud vecinal queda registrada para su seguimiento legislativo. Los concejales de <strong>La Libertad Avanza</strong> relevan los números de trámite en el Concejo Deliberante para exigir respuesta efectiva del municipio y control sobre las tasas.
              </p>

              <div className="pt-3 border-t border-white/15 space-y-2 text-xs">
                <div className="flex items-center justify-between text-white/80">
                  <span>WhatsApp Oficial:</span>
                  <strong className="text-white font-bold">11 3159-6936</strong>
                </div>
                <div className="flex items-center justify-between text-white/80">
                  <span>Sede Central:</span>
                  <span className="text-white">Humberto Primo 990, Burzaco</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-[#230552] border border-white/15 space-y-3">
              <h4 className="text-sm font-bold text-white">Centralización y seguimiento directo</h4>
              <p className="text-xs text-white/80 leading-relaxed">
                Resguardamos cada reclamo ingresado por los vecinos de Brown, gestionamos su ingreso formal ante el área correspondiente y auditamos semanalmente su estado de resolución.
              </p>
              <a
                href="#mapa"
                className="w-full py-2.5 px-3.5 rounded-lg border border-white/25 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>Explorar reclamos en el mapa</span>
                <MapPin className="w-3.5 h-3.5 text-[#39b5e6]" />
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-[#230552] border border-white/15 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <MessageCircle className="w-4 h-4 text-[#39b5e6]" />
                <span>¿Consulta o reclamo urgente?</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Escribinos por WhatsApp y el equipo territorial de tu localidad te asiste directamente.
              </p>
              <a
                href="https://wa.me/5491131596936?text=Hola%20Juan%20Pedro%2C%20tengo%20un%20reclamo%20vecinal%20urgente"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
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
