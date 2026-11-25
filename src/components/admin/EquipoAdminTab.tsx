'use client';

import React, { useState } from 'react';
import { MiembroEquipo, TipoMiembroEquipo } from '@/types';
import { Camera, PlusCircle, Save, Trash2, Users } from 'lucide-react';

interface EquipoAdminTabProps {
  miembros: MiembroEquipo[];
  onRefresh: () => void;
}

const TIPO_LABELS: Record<TipoMiembroEquipo, string> = {
  concejal: 'Concejal HCD',
  consejero: 'Consejero Escolar',
  legislador_provincial: 'Legislador Provincial',
  legislador_nacional: 'Legislador Nacional',
};

export default function EquipoAdminTab({ miembros, onRefresh }: EquipoAdminTabProps) {
  const [filterTipo, setFilterTipo] = useState<'todos' | TipoMiembroEquipo>('todos');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<MiembroEquipo>>({});

  const [nuevo, setNuevo] = useState({
    nombre: '',
    rol: '',
    localidad: 'Provincia de Buenos Aires',
    tipo: 'legislador_provincial' as TipoMiembroEquipo,
    bio: '',
    foto: '/img/a6.jpg',
    instagram: '',
  });
  const [uploadingNew, setUploadingNew] = useState(false);

  const uploadImageFile = async (file: File): Promise<string | null> => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const data = await res.json();
    return res.ok && data.url ? data.url : null;
  };

  const handleReplacePhoto = async (miembro: MiembroEquipo, file: File) => {
    setUploadingId(miembro.id);
    try {
      const url = await uploadImageFile(file);
      if (url) {
        const res = await fetch(`/api/equipo/${miembro.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ foto: url }),
        });
        if (res.ok) onRefresh();
      }
    } finally {
      setUploadingId(null);
    }
  };

  const handleSaveEdit = async (id: string) => {
    const res = await fetch(`/api/equipo/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editDraft),
    });
    if (res.ok) {
      setEditingId(null);
      setEditDraft({});
      onRefresh();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevo.nombre.trim() || !nuevo.rol.trim()) return;
    const res = await fetch('/api/equipo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo),
    });
    if (res.ok) {
      setNuevo({
        nombre: '',
        rol: '',
        localidad: 'Provincia de Buenos Aires',
        tipo: 'legislador_provincial',
        bio: '',
        foto: '/img/a6.jpg',
        instagram: '',
      });
      onRefresh();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Quitar este integrante de la página pública? Quedará respaldado en la base de datos.')) return;
    const res = await fetch(`/api/equipo/${id}`, { method: 'DELETE' });
    if (res.ok) onRefresh();
  };

  const activeList = miembros
    .filter((m) => m.activo !== false)
    .filter((m) => filterTipo === 'todos' || m.tipo === filterTipo);

  return (
    <div className="space-y-6">
      {/* Formulario de alta (Concejales, Consejeros, Legisladores Provinciales y Nacionales) */}
      <form
        onSubmit={handleCreate}
        className="glass-panel rounded-2xl p-6 border border-purple-500/30 space-y-4"
      >
        <div className="flex items-center gap-2 text-white">
          <PlusCircle className="w-5 h-5 text-[#39b5e6]" />
          <h2 className="text-base font-extrabold">
            Agregar Concejal, Consejero o Legislador Provincial / Nacional
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Categoría *</label>
            <select
              value={nuevo.tipo}
              onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value as TipoMiembroEquipo })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            >
              <option value="legislador_provincial">Legislador Provincial</option>
              <option value="legislador_nacional">Legislador Nacional</option>
              <option value="concejal">Concejal HCD</option>
              <option value="consejero">Consejero Escolar</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre y apellido *</label>
            <input
              type="text"
              required
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              placeholder="Ej: Diputado / Senador..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Cargo *</label>
            <input
              type="text"
              required
              value={nuevo.rol}
              onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
              placeholder="Ej: Diputado Provincial PBA"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Distrito / Jurisdicción</label>
            <input
              type="text"
              value={nuevo.localidad}
              onChange={(e) => setNuevo({ ...nuevo, localidad: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-6">
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Reseña / Bio</label>
            <input
              type="text"
              value={nuevo.bio}
              onChange={(e) => setNuevo({ ...nuevo, bio: e.target.value })}
              placeholder="Trayectoria y comisión o agenda de trabajo..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Foto del perfil</label>
            <label className="w-full px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
              <Camera className="w-3.5 h-3.5 text-[#39b5e6]" />
              <span>{uploadingNew ? 'Subiendo...' : 'Subir foto propia'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setUploadingNew(true);
                  const url = await uploadImageFile(f);
                  if (url) setNuevo((prev) => ({ ...prev, foto: url }));
                  setUploadingNew(false);
                }}
              />
            </label>
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-extrabold text-xs"
            >
              Agregar al sitio
            </button>
          </div>
        </div>
      </form>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-white text-sm font-bold">
          <Users className="w-4 h-4 text-[#39b5e6]" />
          <span>Integrantes activos ({activeList.length})</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['todos', 'concejal', 'consejero', 'legislador_provincial', 'legislador_nacional'] as const).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterTipo(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                  filterTipo === t
                    ? 'bg-white text-[#371859]'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
              >
                {t === 'todos' ? 'Todos' : TIPO_LABELS[t]}
              </button>
            )
          )}
        </div>
      </div>

      {/* Grilla con reemplazo de foto individual en 1 clic */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeList.map((m) => {
          const isEditing = editingId === m.id;
          return (
            <div
              key={m.id}
              className="glass-panel rounded-2xl p-4 border border-white/15 flex flex-col justify-between gap-3"
            >
              <div className="flex items-start gap-3.5">
                <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-black/40 border border-white/15 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.foto} alt={m.nombre} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="px-2 py-0.5 rounded bg-[#39b5e6]/20 text-[#39b5e6] text-[10px] font-bold">
                    {TIPO_LABELS[m.tipo]}
                  </span>
                  <h4 className="text-sm font-extrabold text-white mt-1 truncate">{m.nombre}</h4>
                  <p className="text-xs text-slate-300 truncate">{m.rol}</p>
                  <p className="text-[11px] text-slate-400 truncate">{m.localidad}</p>
                </div>
              </div>

              {isEditing ? (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <input
                    type="text"
                    value={editDraft.nombre ?? m.nombre}
                    onChange={(e) => setEditDraft({ ...editDraft, nombre: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/15 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={editDraft.rol ?? m.rol}
                    onChange={(e) => setEditDraft({ ...editDraft, rol: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/15 text-xs text-white"
                  />
                  <textarea
                    rows={3}
                    value={editDraft.bio ?? m.bio ?? ''}
                    onChange={(e) => setEditDraft({ ...editDraft, bio: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded bg-black/30 border border-white/15 text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(m.id)}
                      className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold inline-flex items-center justify-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" /> Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                  <label className="flex-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-[#371859] text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{uploadingId === m.id ? 'Subiendo...' : 'Actualizar foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleReplacePhoto(m, f);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(m.id);
                      setEditDraft({ nombre: m.nombre, rol: m.rol, bio: m.bio, localidad: m.localidad });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300"
                    title="Quitar de la web (mantener respaldo)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
