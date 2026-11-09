'use client';

import React, { useState } from 'react';
import { LOCALIDADES } from '@/data/mockData';
import { Phone, MapPin, Send, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

const OPCIONES_PARTICIPACION = [
  { id: 'Fiscalizar elecciones', label: 'Fiscalizar mesas' },
  { id: 'Sumarme al equipo territorial', label: 'Actividades en mi barrio' },
  { id: 'Aportar proyectos vecinales', label: 'Acercar propuesta al HCD' },
  { id: 'Comerciante o emprendedor', label: 'Comerciante o pyme' },
  { id: 'Voluntario general', label: 'Voluntariado general' },
];

export default function ContactoSection() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [participacion, setParticipacion] = useState<string>('Fiscalizar elecciones');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/meeprnvp', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        setFormSubmitted(true);
        form.reset();
      } else {
        setSubmitError(
          'No pudimos procesar el envío en este momento. Podés escribirnos directo por WhatsApp al 11 3159-6936.'
        );
      }
    } catch {
      setSubmitError(
        'Error de conexión. Escribinos directamente por WhatsApp al 11 3159-6936 y te sumamos al equipo de tu localidad.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-20 bg-[#f5f4f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado directo */}
        <div className="max-w-3xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#1d1d1d] tracking-tight">
            Sumate en tu localidad
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Dejanos tus datos para fiscalizar, sumarte al equipo barrial de tu zona o acercar iniciativas vecinales a nuestra banca en el Concejo Deliberante.
          </p>
        </div>

        {/* Grilla: Sede + Formulario */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Columna de Sede y Contacto (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between h-full">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-[#371859]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block">
                    Sede Central Almirante Brown
                  </span>
                  <span className="text-sm font-bold text-[#1d1d1d] block mt-0.5">
                    Humberto Primo 990, Burzaco
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
                    href="https://wa.me/5491131596936"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-[#371859] hover:underline block mt-0.5"
                  >
                    +54 9 11 3159-6936 (11 3159 6936)
                  </a>
                  <span className="text-xs text-slate-600 block">
                    Respuesta directa del referente de tu localidad
                  </span>
                </div>
              </div>

              <div className="pt-1">
                <div className="relative w-full h-48 rounded-xl overflow-hidden border border-slate-200">
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

          {/* Formulario (7 cols) */}
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
                  Gracias por sumarte. El referente de La Libertad Avanza en tu localidad se va a comunicar con vos por WhatsApp.
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
                  <input type="hidden" name="participacion" value={participacion} />
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
                      name="nombre"
                      required
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
                      name="localidad"
                      required
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                    >
                      <option value="">Seleccioná tu localidad</option>
                      {LOCALIDADES.map((loc) => (
                        <option key={loc.id} value={loc.nombre}>
                          {loc.nombre} (Circuito {loc.circuito})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="telefono" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    required
                    placeholder="Ej: 11 3159-6936"
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="mensaje" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mensaje o barrio (opcional)
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows={3}
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
                  <span>{isSubmitting ? 'Enviando...' : 'Sumarme al equipo'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
