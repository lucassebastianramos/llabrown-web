'use client';

import React, { useState } from 'react';
import { LOCALIDADES } from '@/data/mockData';
import { Phone, MapPin, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function ContactoSection() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
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
        alert('Hubo un inconveniente al enviar el formulario. Podés escribirnos directamente por WhatsApp.');
      }
    } catch (err) {
      alert('Error de conexión. Podés escribirnos directamente por WhatsApp.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-20 bg-[#f5f4f8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Encabezado limpio */}
        <div className="max-w-3xl mb-12">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#6c4c99]">
            Participación Ciudadana
          </p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-[#1d1d1d] tracking-tight">
            Sumate a La Libertad Avanza
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Formá parte del equipo en tu localidad. Dejanos tus datos para fiscalizar, participar de actividades barriales o acercar propuestas para Almirante Brown.
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
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                    Sede Central
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
                  <span className="text-xs uppercase tracking-wider text-slate-500 font-bold block">
                    WhatsApp & Atención Vecinal
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
                    Atención directa a vecinos, referentes y fiscales de Brown
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
                  ¡Datos enviados con éxito!
                </h3>
                <p className="text-slate-600 text-sm max-w-md mb-6">
                  Muchas gracias por sumarte. El equipo territorial de tu localidad se estará comunicando con vos a la brevedad.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="px-5 py-2.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
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
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
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
                    placeholder="+54 9 11 XXXX-XXXX"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="participacion" className="block text-xs font-bold text-slate-700 mb-1.5">
                    ¿Cómo te gustaría participar?
                  </label>
                  <select
                    id="participacion"
                    name="participacion"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                  >
                    <option value="Fiscalizar elecciones">Quiero ser fiscal de mesa / general</option>
                    <option value="Sumarme al equipo territorial">Sumarme a las actividades en mi barrio</option>
                    <option value="Aportar proyectos vecinales">Aportar ideas o proyectos para el Concejo Deliberante</option>
                    <option value="Comerciante o emprendedor">Soy comerciante / pyme y quiero asesoría</option>
                    <option value="Voluntario general">Voluntario general</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mensaje" className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mensaje / Consulta
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows={4}
                    placeholder="Contanos tu inquietud, barrio o propuesta..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#371859] focus:bg-white transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enviando...' : 'Quiero sumarme'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
