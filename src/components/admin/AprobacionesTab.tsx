'use client';

import React, { useState } from 'react';
import { NoticiaItem, ProyectoHCD, VisitaTerritorial } from '@/types';
import { Archive, CheckCircle2, Clock, FileText, MapPin, Newspaper, RotateCcw, Trash2, XCircle } from 'lucide-react';

interface AprobacionesTabProps {
  noticias: NoticiaItem[];
  proyectos: ProyectoHCD[];
  visitas: VisitaTerritorial[];
  onRefreshAll: () => void;
}

type FilterView = 'pendiente' | 'aprobado' | 'rechazado' | 'archivado';

export default function AprobacionesTab({
  noticias,
  proyectos,
  visitas,
  onRefreshAll,
}: AprobacionesTabProps) {
  const [filter, setFilter] = useState<FilterView>('pendiente');
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const unified = [
    ...noticias.map((n) => ({
      kind: 'noticia' as const,
      apiPath: `/api/noticias/${n.id}`,
      badge: `Noticia · ${n.ambito}`,
      id: n.id,
      titulo: n.titulo,
      detalle: n.bajada,
      autor: n.autor,
      creadoPor: n.creadoPor || 'admin',
      fecha: n.fecha,
      localidad: n.localidad || 'Almirante Brown',
      estadoAprobacion: n.estadoAprobacion || 'aprobado',
      motivoRechazo: n.motivoRechazo,
      revisadoPor: n.revisadoPor,
      deletedAt: n.deletedAt,
      adjuntoUrl: n.imagenUrl,
    })),
    ...proyectos.map((p) => ({
      kind: 'proyecto' as const,
      apiPath: `/api/proyectos/${p.id}`,
      badge: `Expediente HCD · ${p.categoria}`,
      id: p.id,
      titulo: p.titulo,
      detalle: p.resumen,
      autor: p.autor,
      creadoPor: p.creadoPor || 'admin',
      fecha: p.fecha,
      localidad: p.localidad,
      estadoAprobacion: p.estadoAprobacion || 'aprobado',
      motivoRechazo: p.motivoRechazo,
      revisadoPor: p.revisadoPor,
      deletedAt: p.deletedAt,
      adjuntoUrl: p.archivoPdf,
    })),
    ...visitas.map((v) => ({
      kind: 'visita' as const,
      apiPath: `/api/visitas/${v.id}`,
      badge: 'Recorrida / Novedad',
      id: v.id,
      titulo: v.titulo,
      detalle: v.descripcion,
      autor: (v.concejales || []).join(', '),
      creadoPor: v.creadoPor || 'admin',
      fecha: v.fecha,
      localidad: v.localidad,
      estadoAprobacion: v.estadoAprobacion || 'aprobado',
      motivoRechazo: v.motivoRechazo,
      revisadoPor: v.revisadoPor,
      deletedAt: v.deletedAt,
      adjuntoUrl: v.fotos?.[0],
    })),
  ];

  const counts = {
    pendiente: unified.filter((x) => !x.deletedAt && x.estadoAprobacion === 'pendiente').length,
    aprobado: unified.filter((x) => !x.deletedAt && x.estadoAprobacion === 'aprobado').length,
    rechazado: unified.filter((x) => !x.deletedAt && x.estadoAprobacion === 'rechazado').length,
    archivado: unified.filter((x) => Boolean(x.deletedAt)).length,
  };

  const filtered = unified.filter((x) => {
    if (filter === 'archivado') return Boolean(x.deletedAt);
    return !x.deletedAt && x.estadoAprobacion === filter;
  });

  const handleReview = async (apiPath: string, id: string, decision: 'aprobado' | 'rechazado') => {
    setBusyId(id);
    try {
      const res = await fetch(apiPath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          motivoRechazo: decision === 'rechazado' ? motivos[id] || 'Revisar redacción o datos adjuntos' : undefined,
        }),
      });
      if (res.ok) {
        onRefreshAll();
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleSoftDelete = async (apiPath: string, id: string) => {
    if (!confirm('¿Archivar este contenido? Quedará oculto en la web pero respaldado permanentemente en la base de datos.')) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(apiPath, { method: 'DELETE' });
      if (res.ok) onRefreshAll();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-white">
              Mesa de Aprobación Editorial y Respaldos
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Todo lo que suben las cuentas de concejales y consejeros escolares ingresa aquí como pendiente. Tanto las aprobaciones como los rechazos y bajas quedan respaldados en PostgreSQL.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'pendiente', label: `Pendientes (${counts.pendiente})`, icon: <Clock className="w-3.5 h-3.5" /> },
                { id: 'aprobado', label: `Aprobados (${counts.aprobado})`, icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
                { id: 'rechazado', label: `Denegados (${counts.rechazado})`, icon: <XCircle className="w-3.5 h-3.5" /> },
                { id: 'archivado', label: `Eliminados/Respaldo (${counts.archivado})`, icon: <Archive className="w-3.5 h-3.5" /> },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                  filter === f.id
                    ? 'bg-white text-[#371859]'
                    : 'bg-white/10 text-white/85 hover:bg-white/20'
                }`}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-panel rounded-2xl p-10 text-center text-sm text-slate-300 border border-white/10">
          No hay registros en la vista <strong>{filter}</strong>.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <div
              key={`${item.kind}-${item.id}`}
              className="glass-panel rounded-2xl p-5 border border-white/15 space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#39b5e6]/20 text-[#39b5e6] font-bold inline-flex items-center gap-1">
                      {item.kind === 'noticia' ? (
                        <Newspaper className="w-3 h-3" />
                      ) : item.kind === 'proyecto' ? (
                        <FileText className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                      {item.badge}
                    </span>
                    <span className="text-slate-300">
                      Subido por <strong className="text-white">@{item.creadoPor}</strong> · {item.fecha} · {item.localidad}
                    </span>
                    {item.revisadoPor && (
                      <span className="text-slate-400">
                        · Revisado por <strong>@{item.revisadoPor}</strong>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-white">{item.titulo}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{item.detalle}</p>
                  <p className="text-[11px] text-slate-400">Autor declarado: {item.autor}</p>

                  {item.motivoRechazo && (
                    <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-400/20 rounded-lg px-3 py-1.5 inline-block">
                      Motivo de denegación: {item.motivoRechazo}
                    </p>
                  )}

                  {item.adjuntoUrl && (
                    <div className="pt-1">
                      <a
                        href={item.adjuntoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#39b5e6] hover:underline"
                      >
                        Ver archivo / foto adjunta →
                      </a>
                    </div>
                  )}
                </div>

                {/* Controles de administrador */}
                <div className="flex flex-col gap-2 min-w-[240px]">
                  {!item.deletedAt && item.estadoAprobacion !== 'aprobado' && (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleReview(item.apiPath, item.id, 'aprobado')}
                      className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Aprobar y publicar en web</span>
                    </button>
                  )}

                  {!item.deletedAt && item.estadoAprobacion !== 'rechazado' && (
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={motivos[item.id] || ''}
                        onChange={(e) => setMotivos({ ...motivos, [item.id]: e.target.value })}
                        placeholder="Motivo si se deniega (opcional)..."
                        className="w-full px-3 py-1.5 rounded-lg bg-black/30 border border-white/15 text-xs text-white placeholder-slate-400"
                      />
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => handleReview(item.apiPath, item.id, 'rechazado')}
                        className="w-full px-4 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Denegar (guardar respaldo)</span>
                      </button>
                    </div>
                  )}

                  {item.deletedAt ? (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleReview(item.apiPath, item.id, 'aprobado')}
                      className="w-full px-4 py-2 rounded-lg bg-[#39b5e6] text-[#120629] text-xs font-bold inline-flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restaurar y republicar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleSoftDelete(item.apiPath, item.id)}
                      className="w-full px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 text-slate-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar de la web (mantener respaldo)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
