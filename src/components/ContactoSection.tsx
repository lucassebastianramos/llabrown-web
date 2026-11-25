'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { LOCALIDADES } from '@/data/mockData';
import { DEFAULT_SITE_CONFIG } from '@/data/seedDefaults';
import { FormularioDinamico, LocalidadInfo, SiteConfig } from '@/types';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';

const OPCIONES_PARTICIPACION = [
  { id: 'Fiscalizar mesas', label: 'Fiscalizar mesas' },
  { id: 'Sumarme al equipo territorial de mi barrio', label: 'Actividades en mi barrio' },
  { id: 'Acercar proyectos para el Concejo Deliberante', label: 'Acercar propuesta al HCD' },
  { id: 'Comerciante o pyme', label: 'Comerciante o pyme' },
  { id: 'Voluntario general', label: 'Voluntariado general' },
];

export default function ContactoSection() {
  const [localidades, setLocalidades] = useState<LocalidadInfo[]>(LOCALIDADES);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [formularios, setFormularios] = useState<FormularioDinamico[]>([]);

  const [nombre, setNombre] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [participacion, setParticipacion] = useState<string>('Fiscalizar mesas');
  const [mensaje, setMensaje] = useState('');

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    fetch('/api/localidades')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setLocalidades(data);
      })
      .catch(() => {});

    fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.emailGeneral) setConfig(data);
      })
      .catch(() => {});

    fetch('/api/formularios')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data)) setFormularios(data);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/formularios/sumate/respuestas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datos: {
            nombre,
            localidad,
            telefono,
            email,
            participacion,
            mensaje,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.ok) {
        setFormSubmitted(true);
        setNombre('');
        setLocalidad('');
        setTelefono('');
        setEmail('');
        setMensaje('');
      } else {
        setSubmitError(
          data.error ||
            'No pudimos registrar el envío en este momento. Podés escribirnos directo por WhatsApp.'
        );
      }
    } catch {
      setSubmitError(
        `Error de conexión. Escribinos directamente por WhatsApp al ${config.whatsappDisplay} o por correo a ${config.emailGeneral}.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-20 bg-[#f5f4f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1d] tracking-tight">
            Sumate en tu localidad
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Dejanos tus datos para fiscalizar, sumarte al equipo barrial de tu zona o acercar iniciativas vecinales. Todo queda registrado de forma directa en nuestra base de datos institucional.
          </p>
        </div>

        {/* Accesos a formularios propios activos (reemplazo nativo de Google Forms) */}
        {formularios.length > 0 && (
          <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {formularios.slice(0, 3).map((f) => (
              <Link
                key={f.id}
                href={`/f/${f.slug}`}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#371859] shadow-sm transition-all flex flex-col justify-between gap-3 group"
              >
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#6c4c99] uppercase tracking-wider">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {f.categoria}
                  </span>
                  <h3 className="mt-1.5 text-sm font-extrabold text-[#1d1d1d] group-hover:text-[#371859]">
                    {f.titulo}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 line-clamp-2">{f.descripcion}</p>
                </div>
                <span className="text-xs font-bold text-[#371859] inline-flex items-center gap-1">
                  <span>Completar formulario</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Grilla: Sede + Correos Oficiales + Formulario */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna de Sede y Canales Oficiales (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[#371859]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block">
                    Sede Central Almirante Brown
                  </span>
                  <span className="text-sm font-bold text-[#1d1d1d] block mt-0.5">
                    {config.sedeDireccion}
                  </span>
                  <span className="text-xs text-slate-600 block">
                    Partido de Almirante Brown, Provincia de Buenos Aires
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[#371859]">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block">
                    WhatsApp de Atención Vecinal
                  </span>
                  <a
                    href={`https://wa.me/${config.whatsappNumero}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-[#371859] hover:underline block mt-0.5"
                  >
                    +54 9 {config.whatsappDisplay}
                  </a>
                  <span className="text-xs text-slate-600 block">
                    Respuesta directa del referente de tu localidad
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[#371859]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-500 block">
                    Correos Oficiales
                  </span>
                  <a
                    href={`mailto:${config.emailGeneral}`}
                    className="text-sm font-bold text-[#371859] hover:underline block break-all"
                  >
                    {config.emailGeneral}
                  </a>
                  <div className="text-slate-600">
                    Fiscalización:{' '}
                    <a href={`mailto:${config.emailFiscalizacion}`} className="font-semibold text-slate-800 hover:underline">
                      {config.emailFiscalizacion}
                    </a>
                  </div>
                  <div className="text-slate-600">
                    Prensa:{' '}
                    <a href={`mailto:${config.emailPrensa}`} className="font-semibold text-slate-800 hover:underline">
                      {config.emailPrensa}
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <div className="relative w-full h-44 rounded-xl overflow-hidden border border-slate-200">
                  <iframe
                    src="https://www.google.com/maps?q=Humberto+Primo+990,+Burzaco&z=16&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    title="Ubicación Sede Central LLA Brown"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-xs text-[#371859] font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Coordinación distrital: Juan Pedro Aquino</span>
            </div>
          </div>

          {/* Formulario directo a nuestra base de datos PostgreSQL (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            {formSubmitted ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-full bg-purple-50 text-[#371859] flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-extrabold text-[#1d1d1d] mb-2">
                  Recibimos tus datos
                </h3>
                <p className="text-slate-600 text-sm max-w-md mb-6">
                  Gracias por sumarte. Tu inscripción ya quedó guardada en nuestra base de datos y el referente de tu localidad se va a comunicar por WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={() => setFormSubmitted(false)}
                  className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs transition-colors"
                >
                  Cargar otro contacto
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div>
                  <span className="block text-xs font-bold text-slate-700 mb-2">
                    ¿Cómo querés participar?
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {OPCIONES_PARTICIPACION.map((op) => {
                      const active = participacion === op.id;
                      return (
                        <button
                          key={op.id}
                          type="button"
                          onClick={() => setParticipacion(op.id)}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                            active
                              ? 'bg-[#371859] text-white border-[#371859]'
                              : 'bg-slate-50 hover:bg-purple-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {op.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nombre" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nombre y apellido *
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="localidad" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Localidad *
                    </label>
                    <select
                      id="localidad"
                      required
                      value={localidad}
                      onChange={(e) => setLocalidad(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    >
                      <option value="">Seleccioná tu localidad</option>
                      {localidades.map((loc) => (
                        <option key={loc.id} value={loc.nombre}>
                          {loc.nombre} (Circuito {loc.circuito})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="telefono" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej: 11 3159-6936"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5">
                      Correo electrónico (opcional)
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="mensaje" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mensaje o barrio (opcional)
                  </label>
                  <textarea
                    id="mensaje"
                    rows={3}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Contanos de qué barrio sos o qué propuesta te gustaría acercar..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[46px] w-full py-3.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registrando...' : 'Sumarme al equipo'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
