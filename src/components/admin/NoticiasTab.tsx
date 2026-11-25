'use client';

import React, { useState } from 'react';
import { LocalidadInfo, NoticiaAmbito, NoticiaItem, SessionUser } from '@/types';
import { CheckCircle2, Clock, Newspaper, Trash2, Upload, XCircle } from 'lucide-react';
import ConfirmPublishModal, { ConfirmPreviewData } from './ConfirmPublishModal';

interface NoticiasTabProps {
  user: SessionUser;
  noticias: NoticiaItem[];
  localidades: LocalidadInfo[];
  onRefresh: () => void;
}

export default function NoticiasTab({ user, noticias, localidades, onRefresh }: NoticiasTabProps) {
  const [titulo, setTitulo] = useState('');
  const [bajada, setBajada] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [ambito, setAmbito] = useState<NoticiaAmbito>('Distrito');
  const [localidad, setLocalidad] = useState('Almirante Brown');
  const [imagenUrl, setImagenUrl] = useState('/img/a6.jpg');
  const [fuenteUrl, setFuenteUrl] = useState('');
  const [autor, setAutor] = useState(user.nombre);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        setImagenUrl(data.url);
      } else {
        setStatusMsg(data.error || 'Error al subir la imagen.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !bajada.trim() || !cuerpo.trim()) return;
    setStatusMsg('');
    setConfirmOpen(true);
  };

  const handleConfirmedSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/noticias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo,
          bajada,
          cuerpo,
          ambito,
          localidad,
          imagenUrl,
          fuenteUrl: fuenteUrl.trim() || undefined,
          autor,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmOpen(false);
        setTitulo('');
        setBajada('');
        setCuerpo('');
        setFuenteUrl('');
        setStatusMsg(
          user.role === 'admin'
            ? 'Noticia publicada correctamente en la web.'
            : 'Noticia enviada a revisión de Coordinación. Aparecerá en la web cuando un Administrador la apruebe.'
        );
        onRefresh();
      } else {
        setStatusMsg(data.error || 'Error al guardar la noticia.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Quitar esta noticia de la web? Quedará respaldada en la base de datos.')) return;
    const res = await fetch(`/api/noticias/${id}`, { method: 'DELETE' });
    if (res.ok) onRefresh();
  };

  const preview: ConfirmPreviewData = {
    tipoEtiqueta: `Noticia (${ambito})`,
    titulo,
    subtitulo: bajada,
    resumen: cuerpo,
    imagenUrl,
    detalles: [
      { label: 'Ámbito', value: ambito },
      { label: 'Localidad', value: localidad },
      { label: 'Autor', value: autor },
      { label: 'Cuenta que sube', value: `@${user.username}` },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <form
        onSubmit={handleOpenConfirm}
        className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-white/15 space-y-4"
      >
        <div className="flex items-center gap-2 text-white">
          <Newspaper className="w-5 h-5 text-[#39b5e6]" />
          <h2 className="text-base font-extrabold">Cargar Noticia / Novedad (Nación o Distrito)</h2>
        </div>

        {statusMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs">
            {statusMsg}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Sección / Ámbito *</label>
            <select
              value={ambito}
              onChange={(e) => setAmbito(e.target.value as NoticiaAmbito)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            >
              <option value="Nación">Nación</option>
              <option value="Provincia">Provincia</option>
              <option value="Distrito">Distrito (Brown)</option>
              <option value="Novedades">Novedades</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Localidad / Alcance</label>
            <select
              value={localidad}
              onChange={(e) => setLocalidad(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            >
              <option value="Argentina / Nación">Argentina / Nación</option>
              <option value="Provincia de Buenos Aires">Provincia de Buenos Aires</option>
              <option value="Almirante Brown">Todo Almirante Brown</option>
              {localidades.map((l) => (
                <option key={l.id} value={l.nombre}>
                  {l.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">Título *</label>
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Presentamos proyecto de alivio fiscal para comercios de Burzaco"
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">Bajada / Resumen corto *</label>
          <textarea
            rows={2}
            required
            value={bajada}
            onChange={(e) => setBajada(e.target.value)}
            placeholder="Dos líneas concretas explicando la noticia..."
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">Desarrollo completo *</label>
          <textarea
            rows={5}
            required
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            placeholder="Redacción completa de la novedad..."
            className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Autor / Firma</label>
            <input
              type="text"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Enlace oficial (opcional)</label>
            <input
              type="url"
              value={fuenteUrl}
              onChange={(e) => setFuenteUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
        </div>

        <div className="p-3 rounded-xl bg-black/25 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-200">Foto de portada</span>
            <label className="px-3 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold cursor-pointer inline-flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Subiendo...' : 'Subir JPG/PNG'}</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
          <input
            type="text"
            value={imagenUrl}
            onChange={(e) => setImagenUrl(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/10 text-[11px] text-slate-300"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-extrabold text-xs uppercase tracking-wider transition-colors"
        >
          Revisar vista previa y enviar
        </button>
      </form>

      {/* Listado */}
      <div className="lg:col-span-7 space-y-3">
        <h3 className="text-sm font-bold text-white/90">
          Publicaciones registradas ({noticias.filter((n) => !n.deletedAt).length})
        </h3>
        {noticias
          .filter((n) => !n.deletedAt)
          .map((n) => (
            <div
              key={n.id}
              className="glass-panel rounded-xl p-4 border border-white/15 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded bg-white/15 text-white">{n.ambito}</span>
                  {n.estadoAprobacion === 'aprobado' ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Aprobada
                    </span>
                  ) : n.estadoAprobacion === 'rechazado' ? (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 inline-flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Denegada
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pendiente de aprobación
                    </span>
                  )}
                  <span className="text-slate-400">
                    {n.fecha} · @{n.creadoPor}
                  </span>
                </div>
                <h4 className="text-sm font-bold text-white">{n.titulo}</h4>
                <p className="text-xs text-slate-300 line-clamp-2">{n.bajada}</p>
                {n.motivoRechazo && (
                  <p className="text-[11px] text-rose-300">Motivo: {n.motivoRechazo}</p>
                )}
              </div>

              {user.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 shrink-0"
                  title="Eliminar de la web (manteniendo respaldo)"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
      </div>

      <ConfirmPublishModal
        open={confirmOpen}
        role={user.role}
        preview={preview}
        submitting={submitting}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmedSubmit}
      />
    </div>
  );
}
