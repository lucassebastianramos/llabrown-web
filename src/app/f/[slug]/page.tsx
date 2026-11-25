'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { FormularioDinamico, LocalidadInfo } from '@/types';
import { LOCALIDADES } from '@/data/mockData';
import { AlertCircle, ArrowLeft, CheckCircle2, Send, ShieldCheck } from 'lucide-react';

export default function DynamicPublicFormPage() {
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === 'string' ? params.slug : '';

  const [formDef, setFormDef] = useState<FormularioDinamico | null>(null);
  const [localidades, setLocalidades] = useState<LocalidadInfo[]>(LOCALIDADES);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/formularios/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (!res.ok) {
          setNotFound(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.id) {
          setFormDef(data);
          const init: Record<string, string | boolean> = {};
          (data.campos || []).forEach((c: any) => {
            init[c.id] = c.tipo === 'checkbox' ? false : '';
          });
          setValues(init);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));

    fetch('/api/localidades')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setLocalidades(data);
      })
      .catch(() => {});
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDef) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      const res = await fetch(`/api/formularios/${encodeURIComponent(formDef.slug)}/respuestas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ datos: values }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSubmittedId(data.respuesta?.id || 'registrado');
      } else {
        setErrorMsg(data.error || 'Revisá los campos obligatorios e intentá nuevamente.');
      }
    } catch {
      setErrorMsg('No pudimos enviar el formulario. Verificá tu conexión e intentá otra vez.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f4f8] text-[#1d1d1d] flex flex-col">
      <header className="bg-[#371859] text-white border-b border-white/10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="relative w-40 h-11 overflow-hidden block" aria-label="Volver al inicio">
            <Image
              src="/img/logo.png"
              alt="La Libertad Avanza Almirante Brown"
              fill
              className="object-contain object-[0%_40%] scale-[1.55] origin-left"
              priority
            />
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-white/85 hover:text-white inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al sitio</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-10">
        {loading ? (
          <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center text-sm text-slate-600">
            Cargando formulario oficial...
          </div>
        ) : notFound || !formDef ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-4">
            <h1 className="text-2xl font-extrabold text-[#1d1d1d]">Formulario no disponible</h1>
            <p className="text-sm text-slate-600">
              El enlace no corresponde a un formulario activo o ya cerró su inscripción.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#371859] text-white text-xs font-bold"
            >
              Ir a llabrown.com.ar
            </Link>
          </div>
        ) : submittedId ? (
          <div className="p-8 sm:p-10 rounded-2xl bg-white border border-slate-200 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-purple-50 text-[#371859] flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#1d1d1d]">¡Respuesta registrada!</h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Tus datos quedaron guardados en la base de datos oficial de{' '}
              <strong>La Libertad Avanza Almirante Brown</strong>. Nuestro equipo se comunicará a la brevedad.
            </p>
            <p className="text-xs font-mono text-[#6c4c99]">Comprobante: {submittedId}</p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setSubmittedId(null);
                  const reset: Record<string, string | boolean> = {};
                  formDef.campos.forEach((c) => {
                    reset[c.id] = c.tipo === 'checkbox' ? false : '';
                  });
                  setValues(reset);
                }}
                className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
              >
                Enviar otra respuesta
              </button>
              <Link
                href="/"
                className="px-5 py-2.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white text-xs font-bold"
              >
                Volver al portal principal
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#230552] text-white p-6 sm:p-8">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/15 text-[#39b5e6] text-[11px] font-bold uppercase tracking-wider mb-3">
                {formDef.categoria}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {formDef.titulo}
              </h1>
              {formDef.descripcion && (
                <p className="mt-2.5 text-sm text-white/85 leading-relaxed">
                  {formDef.descripcion}
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {formDef.campos.map((campo) => (
                <div key={campo.id}>
                  {campo.tipo !== 'checkbox' && (
                    <label
                      htmlFor={`field-${campo.id}`}
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      {campo.label} {campo.requerido ? '*' : ''}
                    </label>
                  )}

                  {campo.tipo === 'textarea' ? (
                    <textarea
                      id={`field-${campo.id}`}
                      rows={4}
                      required={campo.requerido}
                      placeholder={campo.placeholder || ''}
                      value={String(values[campo.id] || '')}
                      onChange={(e) => setValues({ ...values, [campo.id]: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white"
                    />
                  ) : campo.tipo === 'localidad' ? (
                    <select
                      id={`field-${campo.id}`}
                      required={campo.requerido}
                      value={String(values[campo.id] || '')}
                      onChange={(e) => setValues({ ...values, [campo.id]: e.target.value })}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white"
                    >
                      <option value="">Seleccioná tu localidad</option>
                      {localidades.map((loc) => (
                        <option key={loc.id} value={loc.nombre}>
                          {loc.nombre} (Circuito {loc.circuito})
                        </option>
                      ))}
                    </select>
                  ) : campo.tipo === 'select' ? (
                    <select
                      id={`field-${campo.id}`}
                      required={campo.requerido}
                      value={String(values[campo.id] || '')}
                      onChange={(e) => setValues({ ...values, [campo.id]: e.target.value })}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white"
                    >
                      <option value="">Seleccionar una opción...</option>
                      {(campo.opciones || []).map((op) => (
                        <option key={op} value={op}>
                          {op}
                        </option>
                      ))}
                    </select>
                  ) : campo.tipo === 'checkbox' ? (
                    <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(values[campo.id])}
                        onChange={(e) => setValues({ ...values, [campo.id]: e.target.checked })}
                        className="w-4 h-4 accent-[#371859]"
                      />
                      <span className="text-sm font-medium text-slate-800">{campo.label}</span>
                    </label>
                  ) : (
                    <input
                      id={`field-${campo.id}`}
                      type={campo.tipo}
                      required={campo.requerido}
                      placeholder={campo.placeholder || ''}
                      value={String(values[campo.id] || '')}
                      onChange={(e) => setValues({ ...values, [campo.id]: e.target.value })}
                      className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859] focus:bg-white"
                    />
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-[#371859] shrink-0" />
                  <span>Datos guardados en el servidor propio de LLA Almirante Brown</span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-[46px] px-6 py-3 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Enviando...' : 'Enviar respuesta'}</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
