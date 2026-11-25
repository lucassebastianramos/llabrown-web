'use client';

import React, { useEffect, useState } from 'react';
import { AuditLogEntry, LocalidadInfo, SiteConfig } from '@/types';
import { Database, MapPin, PlusCircle, Save, Settings, Trash2 } from 'lucide-react';

interface LocalidadesConfigTabProps {
  localidades: LocalidadInfo[];
  config: SiteConfig;
  onRefresh: () => void;
}

export default function LocalidadesConfigTab({
  localidades,
  config,
  onRefresh,
}: LocalidadesConfigTabProps) {
  const [cfg, setCfg] = useState<SiteConfig>(config);
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgMsg, setCfgMsg] = useState('');

  const [newLoc, setNewLoc] = useState({
    nombre: '',
    circuito: '0019',
    referenteNombre: '',
    descripcion: '',
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    setCfg(config);
  }, [config]);

  useEffect(() => {
    fetch('/api/auditoria')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setAuditLogs(data);
      })
      .catch(() => {});
  }, [localidades.length]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCfg(true);
    setCfgMsg('');
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cfg),
      });
      if (res.ok) {
        setCfgMsg('Configuración guardada y aplicada en la página principal.');
        onRefresh();
      }
    } finally {
      setSavingCfg(false);
    }
  };

  const handleAddLocalidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLoc.nombre.trim()) return;
    const res = await fetch('/api/localidades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLoc),
    });
    if (res.ok) {
      setNewLoc({ nombre: '', circuito: '0019', referenteNombre: '', descripcion: '' });
      onRefresh();
    }
  };

  const handleToggleLocalidad = async (loc: LocalidadInfo) => {
    const res = await fetch(`/api/localidades/${loc.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: loc.activo === false }),
    });
    if (res.ok) onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* 1. Localidades Dinámicas */}
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/30 space-y-5">
        <div className="flex items-center gap-2 text-white">
          <MapPin className="w-5 h-5 text-[#39b5e6]" />
          <div>
            <h2 className="text-base font-extrabold">
              Localidades Activas ({localidades.filter((l) => l.activo !== false).length})
            </h2>
            <p className="text-xs text-slate-300">
              Añadí o quitá localidades: el contador del Hero y los selectores de Reclamos y Formularios se actualizan solos.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddLocalidad} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Nueva localidad *</label>
            <input
              type="text"
              required
              value={newLoc.nombre}
              onChange={(e) => setNewLoc({ ...newLoc, nombre: e.target.value })}
              placeholder="Ej: Barrio San José Oeste"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Circuito</label>
            <input
              type="text"
              value={newLoc.circuito}
              onChange={(e) => setNewLoc({ ...newLoc, circuito: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div className="md:col-span-4">
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Referente / Equipo</label>
            <input
              type="text"
              value={newLoc.referenteNombre}
              onChange={(e) => setNewLoc({ ...newLoc, referenteNombre: e.target.value })}
              placeholder="Equipo Territorial..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full py-2 rounded-lg bg-white text-[#371859] font-extrabold text-xs inline-flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Añadir localidad
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {localidades.map((loc) => (
            <div
              key={loc.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                loc.activo === false
                  ? 'bg-black/20 border-white/5 opacity-60'
                  : 'bg-white/5 border-white/15'
              }`}
            >
              <div className="min-w-0">
                <strong className="text-xs text-white block truncate">{loc.nombre}</strong>
                <span className="text-[10px] text-slate-400">
                  Circuito {loc.circuito} · {loc.activo === false ? 'Oculta (respaldada)' : 'Activa'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleToggleLocalidad(loc)}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-[11px] text-white font-semibold shrink-0 inline-flex items-center gap-1"
              >
                {loc.activo === false ? (
                  'Restaurar'
                ) : (
                  <>
                    <Trash2 className="w-3 h-3 text-rose-300" /> Quitar
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Configuración Dinámica de la Portada y Datos del Sitio */}
      <form
        onSubmit={handleSaveConfig}
        className="glass-panel rounded-2xl p-6 border border-white/15 space-y-4"
      >
        <div className="flex items-center gap-2 text-white">
          <Settings className="w-5 h-5 text-[#39b5e6]" />
          <h2 className="text-base font-extrabold">Textos Dinámicos de Portada, Nación y Contacto</h2>
        </div>

        {cfgMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs">
            {cfgMsg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Título Principal (Hero)</label>
            <input
              type="text"
              value={cfg.heroTitulo}
              onChange={(e) => setCfg({ ...cfg, heroTitulo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Título Sección Nación</label>
            <input
              type="text"
              value={cfg.nacionTitulo}
              onChange={(e) => setCfg({ ...cfg, nacionTitulo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Bajada Hero</label>
            <textarea
              rows={2}
              value={cfg.heroSubtitulo}
              onChange={(e) => setCfg({ ...cfg, heroSubtitulo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Bajada Sección Nación</label>
            <textarea
              rows={2}
              value={cfg.nacionBajada}
              onChange={(e) => setCfg({ ...cfg, nacionBajada: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Cantidad de Barrios</label>
            <input
              type="number"
              value={cfg.barriosCount}
              onChange={(e) => setCfg({ ...cfg, barriosCount: Number(e.target.value) || 176 })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Correo General (Zoho)</label>
            <input
              type="email"
              value={cfg.emailGeneral}
              onChange={(e) => setCfg({ ...cfg, emailGeneral: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Correo Fiscalización</label>
            <input
              type="email"
              value={cfg.emailFiscalizacion}
              onChange={(e) => setCfg({ ...cfg, emailFiscalizacion: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Correo Prensa</label>
            <input
              type="email"
              value={cfg.emailPrensa}
              onChange={(e) => setCfg({ ...cfg, emailPrensa: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingCfg}
          className="px-6 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-extrabold text-xs inline-flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{savingCfg ? 'Guardando...' : 'Guardar configuración del sitio'}</span>
        </button>
      </form>

      {/* 3. Registro de Respaldos y Auditoría Permanente en PostgreSQL */}
      <div className="glass-panel rounded-2xl p-6 border border-white/15 space-y-3">
        <div className="flex items-center gap-2 text-white">
          <Database className="w-5 h-5 text-[#39b5e6]" />
          <h3 className="text-sm font-extrabold">
            Historial de Respaldos y Auditoría Permanente en BD ({auditLogs.length})
          </h3>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-white/10 text-xs">
          {auditLogs.length === 0 ? (
            <p className="text-slate-400 py-3">Los movimientos y respaldos de aprobaciones, rechazos y bajas aparecerán aquí.</p>
          ) : (
            auditLogs.slice(0, 40).map((log) => (
              <div key={log.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded bg-white/10 text-[#39b5e6] font-mono text-[10px] mr-2">
                    {log.entidad}:{log.accion}
                  </span>
                  <span className="text-white font-semibold">{log.detalle || log.entidadId}</span>
                </div>
                <span className="text-slate-400 text-[11px]">
                  @{log.usuario} ({log.rol}) · {new Date(log.createdAt).toLocaleString('es-AR')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
