'use client';

import React, { useState } from 'react';
import { LOCALIDADES } from '@/data/mockData';
import { Mail, Phone, MapPin, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

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
    <section id="contacto" className="py-20 relative bg-[#08040d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-900/40 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Sumate al Cambio</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
            Conectate con <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">Nosotros</span>
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base">
            Sumate al equipo de tu localidad. Dejanos tus datos para fiscalizar, participar de actividades o acercar propuestas vecinales en Almirante Brown.
          </p>
        </div>

        {/* Layout: Info + Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Info Card (5 cols) */}
          <div className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl flex flex-col justify-between h-full">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-900/50 border border-purple-700/50 text-amber-400">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                    Sede Central
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    Humberto Primo 990, Burzaco
                  </span>
                  <span className="text-xs text-slate-300 block">
                    Partido de Almirante Brown, PBA
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-900/50 border border-purple-700/50 text-amber-400">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                    WhatsApp & Atención Vecinal
                  </span>
                  <a 
                    href="https://wa.me/5491131596936" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-white hover:text-amber-400 transition-colors block mt-0.5"
                  >
                    +54 9 11 3159-6936 (11 3159 6936)
                  </a>
                  <span className="text-xs text-purple-300 block">
                    Atención directa a vecinos y fiscales de Brown
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-purple-900/50 border border-purple-700/50 text-amber-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
                    Correo Electrónico
                  </span>
                  <span className="text-sm font-bold text-white block mt-0.5">
                    contacto@llaalmibrown.ar
                  </span>
                </div>
              </div>

              {/* Google Maps embed */}
              <div className="pt-2">
                <div className="relative w-full h-44 rounded-2xl overflow-hidden border border-purple-800/60">
                  <iframe
                    src="https://www.google.com/maps?q=Humberto+Primo+990,+Burzaco&z=16&output=embed"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'grayscale(40%) contrast(1.1)' }}
                    allowFullScreen={false}
                    loading="lazy"
                    title="Ubicación Sede Central LLA Brown"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-purple-900/40 flex items-center gap-2 text-xs text-amber-400 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Coordinación: Juan Pedro Aquino</span>
            </div>
          </div>

          {/* Form (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-purple-500/30 shadow-2xl">
            {formSubmitted ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <CheckCircle2 className="w-16 h-16 text-amber-400 mb-4 animate-bounce" />
                <h3 className="text-2xl font-black text-white mb-2">¡Mensaje Enviado con Éxito!</h3>
                <p className="text-slate-300 text-sm max-w-md mb-6">
                  Muchas gracias por sumarte. El equipo territorial de tu localidad se estará comunicando con vos muy pronto.
                </p>
                <button
                  onClick={() => setFormSubmitted(false)}
                  className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs uppercase tracking-wider"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="nombre" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      required
                      placeholder="Tu nombre y apellido"
                      className="w-full px-4 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="localidad" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Localidad *
                    </label>
                    <select
                      id="localidad"
                      name="localidad"
                      required
                      className="w-full px-4 py-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                    >
                      <option value="">Seleccioná tu localidad</option>
                      {LOCALIDADES.map((loc) => (
                        <option key={loc.id} value={loc.nombre} className="bg-[#140b24] text-white">
                          {loc.nombre} (Circuito {loc.circuito})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="telefono" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      required
                      placeholder="+54 9 11 XXXX-XXXX"
                      className="w-full px-4 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="tu@email.com"
                      className="w-full px-4 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="participacion" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    ¿Cómo te gustaría participar?
                  </label>
                  <select
                    id="participacion"
                    name="participacion"
                    className="w-full px-4 py-2.5 rounded-xl bg-purple-950/60 border border-purple-800/60 text-sm text-white focus:outline-none focus:border-amber-400 transition-colors"
                  >
                    <option value="Fiscalizar elecciones">Quiero ser fiscal de mesa / general</option>
                    <option value="Sumarme al equipo territorial">Sumarme a las actividades en mi barrio</option>
                    <option value="Aportar proyectos vecinales">Aportar ideas o proyectos para el Concejo Deliberante</option>
                    <option value="Comerciante o emprendedor">Soy comerciante / pyme y quiero asesoría</option>
                    <option value="Voluntario general">Voluntario general</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="mensaje" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Mensaje / Consulta
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows={4}
                    placeholder="Contanos tu inquietud, barrio específico o sugerencia..."
                    className="w-full px-4 py-2.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-sm uppercase tracking-wider shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'Enviando...' : 'Quiero Sumarme →'}</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
