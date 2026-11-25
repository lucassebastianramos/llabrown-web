'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { UserRole } from '@/types';

export interface ConfirmPreviewData {
  tipoEtiqueta: string;
  titulo: string;
  subtitulo?: string;
  resumen: string;
  detalles: Array<{ label: string; value: string }>;
  imagenUrl?: string;
  pdfNombre?: string;
}

interface ConfirmPublishModalProps {
  open: boolean;
  role: UserRole;
  preview: ConfirmPreviewData | null;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmPublishModal({
  open,
  role,
  preview,
  submitting,
  onCancel,
  onConfirm,
}: ConfirmPublishModalProps) {
  const [chkOrtografia, setChkOrtografia] = useState(false);
  const [chkPrivacidad, setChkPrivacidad] = useState(false);
  const [chkRevision, setChkRevision] = useState(false);

  useEffect(() => {
    if (open) {
      setChkOrtografia(false);
      setChkPrivacidad(false);
      setChkRevision(false);
    }
  }, [open, preview?.titulo]);

  if (!open || !preview) return null;

  const allChecked = chkOrtografia && chkPrivacidad && chkRevision;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirmación previa al envío"
      className="fixed inset-0 z-[80] bg-[#120629]/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white text-[#1d1d1d] shadow-2xl border border-slate-200">
        {/* Cabecera */}
        <div className="px-6 py-4 bg-[#371859] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-[#39b5e6]" />
            <div>
              <h3 className="text-base font-extrabold">Verificación obligatoria antes de enviar</h3>
              <p className="text-[11px] text-white/80">
                Revisá cada dato con atención para evitar errores en la publicación oficial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white"
            aria-label="Cerrar verificación"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Aviso de flujo según rol */}
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
              role === 'admin'
                ? 'bg-purple-50 border-purple-200 text-[#371859]'
                : 'bg-sky-50 border-sky-200 text-sky-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {role === 'admin' ? (
                <>
                  <strong>Rol Administrador:</strong> Al confirmar, este contenido se publicará directamente en{' '}
                  <code>llabrown.com.ar</code> y quedará registrado con respaldo en la base de datos.
                </>
              ) : (
                <>
                  <strong>Cuenta de Equipo ({preview.tipoEtiqueta}):</strong> Al confirmar, el envío quedará guardado en
                  la base de datos como <strong>PENDIENTE DE APROBACIÓN</strong>. No aparecerá en la web pública hasta
                  que un Administrador lo apruebe. No podrás borrarlo después de enviarlo.
                </>
              )}
            </div>
          </div>

          {/* Vista previa real */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#371859] text-white text-[10px] font-bold uppercase tracking-wider">
                Vista previa · {preview.tipoEtiqueta}
              </span>
              {preview.pdfNombre && (
                <span className="text-[11px] font-mono text-[#6c4c99] font-semibold">
                  PDF: {preview.pdfNombre}
                </span>
              )}
            </div>

            {preview.imagenUrl && (
              <div className="relative h-40 w-full rounded-lg overflow-hidden border border-slate-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview.imagenUrl}
                  alt={preview.titulo}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <h4 className="text-lg font-extrabold text-[#1d1d1d] leading-snug">{preview.titulo}</h4>
            {preview.subtitulo && (
              <p className="text-xs font-semibold text-[#6c4c99]">{preview.subtitulo}</p>
            )}
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {preview.resumen}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
              {preview.detalles.map((d) => (
                <div key={d.label} className="bg-white rounded-lg px-3 py-1.5 border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">{d.label}</span>
                  <strong className="text-slate-900">{d.value || '—'}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist obligatorio anti-errores */}
          <div className="space-y-2.5">
            <span className="text-xs font-extrabold text-slate-800 block">
              Marcá las 3 casillas para habilitar el envío:
            </span>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={chkOrtografia}
                onChange={(e) => setChkOrtografia(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#371859]"
              />
              <span>
                Revisé la ortografía, los nombres propios, la fecha, la localidad y el número de expediente o categoría.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={chkPrivacidad}
                onChange={(e) => setChkPrivacidad(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#371859]"
              />
              <span>
                Verifiqué que la foto o archivo adjunto es correcto y no expone datos privados sensibles (DNI/teléfonos) sin autorización.
              </span>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={chkRevision}
                onChange={(e) => setChkRevision(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#371859]"
              />
              <span>
                {role === 'admin'
                  ? 'Confirmo que el contenido respeta la línea institucional de La Libertad Avanza Almirante Brown.'
                  : 'Entiendo que este envío pasará a revisión de los Administradores y quedará respaldado en la base de datos.'}
              </span>
            </label>
          </div>

          {/* Acciones */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Volver y corregir
            </button>
            <button
              type="button"
              disabled={!allChecked || submitting}
              onClick={onConfirm}
              className="px-6 py-2.5 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {submitting
                  ? 'Guardando...'
                  : role === 'admin'
                    ? 'Confirmar y publicar ahora'
                    : 'Confirmar y enviar a revisión'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
