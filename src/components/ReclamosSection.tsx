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
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';
import { buildWhatsAppReclamoUrl } from '@/lib/municipalReclamoService';

interface PublicTrackingResult {
  codigoSeguimiento: string;
  localidad: string;
  barrio?: string;
  tipoReclamo: string;
  estado: string;
  numeroReclamoMunicipal?: string;
  patrocinadoPor: string;
  fecha: string;
}

export default function ReclamosSection() {
  const [activeMode, setActiveMode] = useState<'nuevo' | 'consultar'>('nuevo');

  // Estado de formulario de nuevo reclamo
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

  const [localidadesList, setLocalidadesList] = useState(LOCALIDADES);
  const [barriosList, setBarriosList] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/localidades')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setLocalidadesList(data);
      })
      .catch(() => {});
  }, []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string>('');
  const [submittedReclamo, setSubmittedReclamo] = useState<ReclamoVecinal | null>(null);
  const [resultadoMsg, setResultadoMsg] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDigestoGuide, setShowDigestoGuide] = useState(false);

  // Estado de consulta de seguimiento
  const [codigoBusqueda, setCodigoBusqueda] = useState<string>('');
  const [isSearchingCode, setIsSearchingCode] = useState(false);
  const [trackingError, setTrackingError] = useState<string>('');
  const [trackingResult, setTrackingResult] = useState<PublicTrackingResult | null>(null);

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

  const ACCESOS_RAPIDOS = [
    { label: 'Bacheo y calles', value: 'Vía Pública / Bacheo de Calles' },
    { label: 'Luminaria apagada', value: 'Luminarias (Rotas, apagadas o cables expuestos)' },
    { label: 'Basural o poda', value: 'Higiene Urbana / Basurales a cielo abierto' },
    { label: 'Tasas abusivas', value: 'Tasas Municipales (Cobros abusivos / reclamo)' },
    { label: 'Seguridad barrial', value: 'Defensa Civil / Seguridad Barrial' },
  ];

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
      detalle: 'Delimitación y denominación oficial de los 176 barrios de Almirante Brown.',
    },
    {
      titulo: 'Ordenanza Fiscal e Impositiva',
      detalle: 'Tasa por Servicios Generales: conservación, alumbrado y limpieza de la vía pública.',
    },
    {
      titulo: 'Reglamento de Tránsito y Obras',
      detalle: 'Obligación municipal de señalización, bacheo y transitabilidad segura.',
    },
    {
      titulo: 'Higiene Urbana y Medio Ambiente',
      detalle: 'Erradicación de microbasurales y mantenimiento de zanjas y desagües pluviales.',
    },
  ];

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!calle.trim() || !descripcion.trim() || !nombreVecino.trim() || !telefonoVecino.trim()) {
      setFormError('Completá la calle, el detalle del problema, tu nombre y un teléfono de contacto.');
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
        setResultadoMsg(data.resultadoMunicipal?.mensaje || 'Reclamo registrado correctamente.');
      } else {
        setFormError(data.error || 'No pudimos registrar el reclamo. Revisá los datos e intentá de nuevo.');
      }
    } catch {
      setFormError('Sin conexión con el servidor. Podés enviarnos el reclamo por WhatsApp al 11 3159-6936.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = codigoBusqueda.trim().toUpperCase();
    if (!clean) {
      setTrackingError('Ingresá tu código de seguimiento (por ejemplo: LLA-REC-2026-4821).');
      return;
    }

    setIsSearchingCode(true);
    setTrackingError('');
    setTrackingResult(null);

    try {
      const res = await fetch(`/api/reclamos?codigo=${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (res.ok && data.reclamo) {
        setTrackingResult(data.reclamo);
      } else {
        setTrackingError(
          data.error || 'No encontramos un reclamo con ese código. Revisá que esté escrito completo.'
        );
      }
    } catch {
      setTrackingError('No pudimos consultar el estado ahora. Podés consultar por WhatsApp al 11 3159-6936.');
    } finally {
      setIsSearchingCode(false);
    }
  };

  const handleReset = () => {
    setSubmittedReclamo(null);
    setFormError('');
    setCalle('');
    setAltura('');
    setEntreCalles('');
    setDescripcion('');
    setNormaDigesto('');
  };

  return (
    <section id="reclamos" className="py-20 bg-[#371859] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado y selector de acción */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Reclamos vecinales con auditoría en el HCD
            </h2>
            <p className="mt-3 text-white/85 text-sm sm:text-base leading-relaxed">
              Registrá el problema de tu cuadra para que el bloque de concejales de <strong>La Libertad Avanza</strong>, encabezado por <strong>Juan Pedro Aquino</strong>, gestione el trámite formal y controle los plazos de respuesta del municipio.
            </p>
          </div>

          <div className="inline-flex p-1 rounded-xl bg-[#230552] border border-white/15 shrink-0 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => setActiveMode('nuevo')}
              className={`min-h-[42px] px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                activeMode === 'nuevo'
                  ? 'bg-white text-[#371859] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Cargar nuevo reclamo
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('consultar')}
              className={`min-h-[42px] px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeMode === 'consultar'
                  ? 'bg-white text-[#371859] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Consultar mi código</span>
            </button>
          </div>
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
                  Cada reclamo barrial está respaldado por ordenanzas vigentes de alumbrado, bacheo, higiene urbana y tasas que el Ejecutivo Municipal tiene obligación de cumplir.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0 w-full lg:w-auto">
              <a
                href="https://a.brown.gob.ar/hcd/digesto/buscarporpalabra"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-3.5 py-2 rounded-lg border border-white/25 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-[#39b5e6]" />
                <span>Por palabra clave</span>
                <ExternalLink className="w-3 h-3 text-white/70" />
              </a>

              <a
                href="https://a.brown.gob.ar/hcd/digesto/buscarpornumero"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-3.5 py-2 rounded-lg border border-white/25 hover:bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-[#39b5e6]" />
                <span>Por N° de norma</span>
                <ExternalLink className="w-3 h-3 text-white/70" />
              </a>

              <a
                href="https://a.brown.gob.ar/hcd/digesto"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-[#371859] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <span>Abrir Digesto HCD</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Grilla principal */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            {activeMode === 'consultar' ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-white text-[#1d1d1d] shadow-xl space-y-6 animate-fadeIn">
                <div className="pb-4 border-b border-slate-200">
                  <h3 className="text-xl font-extrabold text-[#1d1d1d]">
                    Seguimiento de reclamo vecinal
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Ingresá el código que recibiste al cargar tu solicitud para verificar su estado y número de expediente municipal.
                  </p>
                </div>

                <form onSubmit={handleSearchCodigo} className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={codigoBusqueda}
                    onChange={(e) => setCodigoBusqueda(e.target.value)}
                    placeholder="Ej: LLA-REC-2026-4821"
                    className="flex-1 min-h-[46px] px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 font-mono text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isSearchingCode}
                    className="min-h-[46px] px-6 py-2.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <Search className="w-4 h-4" />
                    <span>{isSearchingCode ? 'Consultando...' : 'Consultar estado'}</span>
                  </button>
                </form>

                {trackingError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{trackingError}</span>
                  </div>
                )}

                {trackingResult && (
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          Código verificado
                        </span>
                        <span className="font-mono text-base font-extrabold text-[#371859]">
                          {trackingResult.codigoSeguimiento}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-xs font-bold text-[#371859]">
                        {trackingResult.estado}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                      <div>
                        <span className="text-slate-500 block">Categoría</span>
                        <strong className="text-slate-900">{trackingResult.tipoReclamo}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Localidad y fecha</span>
                        <strong className="text-slate-900">
                          {trackingResult.barrio ? `${trackingResult.barrio}, ` : ''}
                          {trackingResult.localidad} · {trackingResult.fecha}
                        </strong>
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-600">N° de trámite municipal asignado:</span>
                        <strong className="text-[#371859]">
                          {trackingResult.numeroReclamoMunicipal ||
                            'En carga administrativa por el Bloque LLA'}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : submittedReclamo ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-white text-[#1d1d1d] shadow-xl animate-fadeIn">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[#371859]">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#6c4c99] block">
                      Solicitud registrada en el Bloque LLA
                    </span>
                    <h3 className="text-2xl font-extrabold text-[#1d1d1d]">
                      Guardá tu código de seguimiento
                    </h3>
                  </div>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 mb-6 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <span className="text-xs text-slate-600">Código de seguimiento LLA:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-[#371859] bg-purple-50 px-3 py-1 rounded-md border border-purple-200">
                        {submittedReclamo.codigoSeguimiento}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(submittedReclamo.codigoSeguimiento)}
                        className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 transition-colors"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <span className="text-xs text-slate-600">Patrocinio institucional:</span>
                    <span className="text-xs font-bold text-slate-900">
                      {submittedReclamo.patrocinadoPor}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <span className="text-xs text-slate-600">Ubicación declarada:</span>
                    <span className="text-xs font-semibold text-slate-800">
                      {submittedReclamo.calle} {submittedReclamo.altura || ''} ·{' '}
                      {submittedReclamo.barrio ? `${submittedReclamo.barrio}, ` : ''}
                      {submittedReclamo.localidad}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-600">Estado administrativo:</span>
                    <span className="text-xs font-bold text-[#371859]">
                      {submittedReclamo.numeroReclamoMunicipal
                        ? `Ingresado · N° Oficial: ${submittedReclamo.numeroReclamoMunicipal}`
                        : 'Registrado · En gestión ante el área municipal'}
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
                    className="min-h-[44px] flex-1 py-3 px-4 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 text-white" />
                    <span>Enviar comprobante al equipo de Juan Pedro Aquino</span>
                  </a>

                  <a
                    href="#mapa"
                    className="min-h-[44px] py-3 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#371859]" />
                    <span>Ver mapa</span>
                  </a>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="min-h-[44px] py-3 px-4 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-colors"
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
                    Elegí el motivo o completá la dirección exacta para iniciar el seguimiento legislativo.
                  </p>

                  {/* Accesos rápidos de 1 clic (onboarding-cro) */}
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {ACCESOS_RAPIDOS.map((item) => {
                      const selected = tipoReclamo === item.value;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setTipoReclamo(item.value)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                            selected
                              ? 'bg-[#371859] text-white border-[#371859]'
                              : 'bg-slate-50 hover:bg-purple-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* 1. Localidad & Barrio */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Localidad *
                    </label>
                    <select
                      value={localidad}
                      onChange={(e) => setLocalidad(e.target.value as LocalidadNombre)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                      required
                    >
                      {localidadesList.map((loc) => (
                        <option key={loc.id} value={loc.nombre}>
                          {loc.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Barrio oficial (Ord. 13.906)</span>
                      <span className="text-[10px] font-semibold text-[#6c4c99]">
                        {barriosList.length} barrios
                      </span>
                    </label>
                    <select
                      value={barrio}
                      onChange={(e) => setBarrio(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
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
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
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
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
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
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
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
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
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
                    <span className="text-[11px] font-normal text-slate-500">
                      Incluí referencias útiles de la cuadra
                    </span>
                  </label>
                  <textarea
                    rows={4}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Contanos desde cuándo ocurre, si impide el paso de colectivos o ambulancias, postes afectados o reclamos previos sin respuesta..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    required
                  />
                </div>

                {/* 5. Cita del Digesto (Opcional) */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#371859] flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5" />
                      Ordenanza de respaldo en el Digesto HCD (opcional)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowDigestoGuide(!showDigestoGuide)}
                      className="text-[11px] font-semibold text-[#6c4c99] hover:text-[#371859] underline transition-colors"
                    >
                      {showDigestoGuide ? 'Ocultar sugerencias' : 'Elegir norma sugerida'}
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
                    placeholder="Ej: Ordenanza 13.906 / Ordenanza Fiscal de Alumbrado y Conservación"
                    className="w-full min-h-[40px] px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] transition-colors"
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
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
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
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      DNI (opcional)
                    </label>
                    <input
                      type="text"
                      value={dniVecino}
                      onChange={(e) => setDniVecino(e.target.value)}
                      placeholder="Patrocina Bloque LLA"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Botón de envío */}
                <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="w-4 h-4 text-[#371859] shrink-0" />
                    <span>Tus datos personales son confidenciales y no se publican</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-h-[46px] px-6 py-3 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Registrando...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Registrar reclamo vecinal</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Columna Derecha: Proceso real en 3 pasos secuenciales (frontend-design §30 + storybrand) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="p-6 rounded-2xl bg-[#230552] border border-white/15 space-y-4">
              <h4 className="text-base font-bold text-white">¿Cómo auditamos cada reclamo?</h4>

              <ol className="space-y-3.5 text-xs">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/15 text-[#39b5e6] font-extrabold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <strong className="text-white block">Registro con código propio</strong>
                    <span className="text-white/75 leading-relaxed">
                      Tu solicitud queda asentada en nuestra base con código <code className="text-white">LLA-REC</code>.
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/15 text-[#39b5e6] font-extrabold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <strong className="text-white block">Presentación administrativa</strong>
                    <span className="text-white/75 leading-relaxed">
                      El equipo del concejal Juan Pedro Aquino ingresa el trámite formal ante el municipio.
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white/15 text-[#39b5e6] font-extrabold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <strong className="text-white block">Exigencia en el Concejo Deliberante</strong>
                    <span className="text-white/75 leading-relaxed">
                      Si el Ejecutivo demora la obra o el arreglo, elevamos pedido de informes o minuta en el HCD.
                    </span>
                  </div>
                </li>
              </ol>

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
              <h4 className="text-sm font-bold text-white">Mapa de reclamos barriales</h4>
              <p className="text-xs text-white/80 leading-relaxed">
                Consultá los puntos relevados por nuestros concejales en cada localidad y sumá tu apoyo vecinal a las obras prioritarias de tu cuadra.
              </p>
              <a
                href="#mapa"
                className="min-h-[42px] w-full py-2.5 px-3.5 rounded-lg border border-white/25 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>Explorar reclamos en el mapa</span>
                <MapPin className="w-3.5 h-3.5 text-[#39b5e6]" />
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-[#230552] border border-white/15 space-y-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <MessageCircle className="w-4 h-4 text-[#39b5e6]" />
                <span>¿Urgencia en la vía pública?</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Para cables caídos, anegamientos graves o falta de guardia en CAPS, escribinos directo por WhatsApp adjuntando foto de la calle.
              </p>
              <a
                href="https://wa.me/5491131596936?text=Hola%20Juan%20Pedro%2C%20tengo%20un%20reclamo%20vecinal%20urgente"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[42px] w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
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
