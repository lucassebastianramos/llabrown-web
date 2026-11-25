'use client';

import React, { useState } from 'react';
import { CampoFormulario, CampoTipo, FormularioDinamico, FormularioRespuesta } from '@/types';
import {
  Check,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Plus,
  Trash2,
} from 'lucide-react';

interface FormulariosTabProps {
  formularios: FormularioDinamico[];
  onRefresh: () => void;
}

const DEFAULT_FIELDS: CampoFormulario[] = [
  { id: 'nombre', label: 'Nombre y apellido', tipo: 'text', requerido: true, placeholder: 'Tu nombre' },
  { id: 'telefono', label: 'WhatsApp / Teléfono', tipo: 'tel', requerido: true, placeholder: '11 XXXX-XXXX' },
  { id: 'email', label: 'Correo electrónico', tipo: 'email', requerido: false, placeholder: 'tu@correo.com' },
  { id: 'localidad', label: 'Localidad', tipo: 'localidad', requerido: true },
];

export default function FormulariosTab({ formularios, onRefresh }: FormulariosTabProps) {
  const [titulo, setTitulo] = useState('');
  const [slug, setSlug] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('Fiscalización');
  const [emailNotificacion, setEmailNotificacion] = useState('fiscalizacion@llabrown.com.ar');
  const [campos, setCampos] = useState<CampoFormulario[]>(DEFAULT_FIELDS);

  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<CampoTipo>('text');
  const [newFieldReq, setNewFieldReq] = useState(true);
  const [newFieldOptions, setNewFieldOptions] = useState('');

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [viewingForm, setViewingForm] = useState<FormularioDinamico | null>(null);
  const [respuestas, setRespuestas] = useState<FormularioRespuesta[]>([]);
  const [loadingResp, setLoadingResp] = useState(false);

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const id =
      newFieldLabel
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '') || `campo_${Date.now()}`;

    const field: CampoFormulario = {
      id,
      label: newFieldLabel.trim(),
      tipo: newFieldType,
      requerido: newFieldReq,
      opciones:
        newFieldType === 'select'
          ? newFieldOptions
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean)
          : undefined,
    };
    setCampos((prev) => [...prev, field]);
    setNewFieldLabel('');
    setNewFieldOptions('');
  };

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || campos.length === 0) return;

    const res = await fetch('/api/formularios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo,
        slug: slug.trim() || titulo,
        descripcion,
        categoria,
        emailNotificacion: emailNotificacion.trim() || undefined,
        campos,
        activo: true,
      }),
    });
    if (res.ok) {
      setTitulo('');
      setSlug('');
      setDescripcion('');
      setCampos(DEFAULT_FIELDS);
      onRefresh();
    } else {
      const err = await res.json();
      alert(err.error || 'No se pudo crear el formulario.');
    }
  };

  const handleToggleActive = async (form: FormularioDinamico) => {
    const res = await fetch(`/api/formularios/${form.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !form.activo }),
    });
    if (res.ok) onRefresh();
  };

  const handleDeleteForm = async (form: FormularioDinamico) => {
    if (!confirm(`¿Desactivar y archivar el formulario "${form.titulo}"? Sus respuestas siguen en PostgreSQL.`)) {
      return;
    }
    const res = await fetch(`/api/formularios/${form.id}`, { method: 'DELETE' });
    if (res.ok) onRefresh();
  };

  const handleViewRespuestas = async (form: FormularioDinamico) => {
    setViewingForm(form);
    setLoadingResp(true);
    try {
      const res = await fetch(`/api/formularios/${form.slug}/respuestas`);
      const data = await res.json();
      setRespuestas(Array.isArray(data) ? data : []);
    } finally {
      setLoadingResp(false);
    }
  };

  const exportCsv = () => {
    if (!viewingForm || respuestas.length === 0) return;
    const headers = ['Fecha', ...viewingForm.campos.map((c) => c.label)];
    const rows = respuestas.map((r) => [
      new Date(r.createdAt).toLocaleString('es-AR'),
      ...viewingForm.campos.map((c) => {
        const val = r.datos?.[c.id];
        const txt = typeof val === 'boolean' ? (val ? 'Sí' : 'No') : String(val ?? '');
        return `"${txt.replace(/"/g, '""')}"`;
      }),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respuestas-${viewingForm.slug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyLink = (formSlug: string) => {
    const link = `${window.location.origin}/f/${formSlug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(formSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Constructor de Formularios */}
      <form
        onSubmit={handleCreateForm}
        className="glass-panel rounded-2xl p-6 border border-purple-500/30 space-y-4"
      >
        <div className="flex items-center gap-2 text-white">
          <ClipboardList className="w-5 h-5 text-[#39b5e6]" />
          <div>
            <h2 className="text-base font-extrabold">Crear Formulario Propio (Reemplazo de Google Forms)</h2>
            <p className="text-xs text-slate-300">
              Cada formulario genera su link público en <code>llabrown.com.ar/f/tu-nombre</code> y guarda todas las respuestas en PostgreSQL.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Título del formulario *</label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Inscripción Capacitación Fiscales Burzaco"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">URL / Slug (opcional)</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="capacitacion-burzaco"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Categoría</label>
            <input
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Fiscalización, Evento, Encuesta..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Descripción para el vecino</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Breve explicación de para qué sirve el formulario..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Notificar respuestas por Zoho Mail a:</label>
            <select
              value={emailNotificacion}
              onChange={(e) => setEmailNotificacion(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            >
              <option value="fiscalizacion@llabrown.com.ar">fiscalizacion@llabrown.com.ar</option>
              <option value="lalibertadavanza@llabrown.com.ar">lalibertadavanza@llabrown.com.ar</option>
              <option value="prensa@llabrown.com.ar">prensa@llabrown.com.ar</option>
              <option value="">Solo guardar en base de datos (sin mail)</option>
            </select>
          </div>
        </div>

        {/* Constructor de campos */}
        <div className="p-4 rounded-xl bg-black/25 border border-white/10 space-y-3">
          <span className="text-xs font-bold text-white block">Campos del formulario ({campos.length})</span>
          <div className="flex flex-wrap gap-2">
            {campos.map((c, idx) => (
              <div
                key={`${c.id}-${idx}`}
                className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-xs text-white flex items-center gap-2"
              >
                <span>
                  <strong>{c.label}</strong> ({c.tipo}{c.requerido ? ' *' : ''})
                </span>
                <button
                  type="button"
                  onClick={() => setCampos((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-rose-300 hover:text-rose-200"
                  aria-label="Quitar campo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-2 border-t border-white/10 items-center">
            <input
              type="text"
              value={newFieldLabel}
              onChange={(e) => setNewFieldLabel(e.target.value)}
              placeholder="Nombre del nuevo campo (ej: Escuela donde vota)"
              className="md:col-span-4 px-3 py-1.5 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
            <select
              value={newFieldType}
              onChange={(e) => setNewFieldType(e.target.value as CampoTipo)}
              className="md:col-span-2 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            >
              <option value="text">Texto corto</option>
              <option value="textarea">Párrafo</option>
              <option value="tel">Teléfono</option>
              <option value="email">Email</option>
              <option value="number">Número / DNI</option>
              <option value="localidad">Selector Localidad</option>
              <option value="select">Lista de opciones</option>
              <option value="checkbox">Casilla Sí/No</option>
              <option value="date">Fecha</option>
            </select>
            {newFieldType === 'select' ? (
              <input
                type="text"
                value={newFieldOptions}
                onChange={(e) => setNewFieldOptions(e.target.value)}
                placeholder="Opciones separadas por coma"
                className="md:col-span-3 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
              />
            ) : (
              <label className="md:col-span-3 flex items-center gap-2 text-xs text-slate-300 px-2">
                <input
                  type="checkbox"
                  checked={newFieldReq}
                  onChange={(e) => setNewFieldReq(e.target.checked)}
                />
                <span>Campo obligatorio</span>
              </label>
            )}
            <button
              type="button"
              onClick={handleAddField}
              className="md:col-span-3 py-1.5 px-3 rounded-lg bg-[#39b5e6] text-[#120629] font-bold text-xs inline-flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar campo
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-extrabold text-xs"
        >
          Publicar formulario en llabrown.com.ar/f/...
        </button>
      </form>

      {/* Listado de formularios creados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {formularios.map((f) => (
          <div
            key={f.id}
            className="glass-panel rounded-2xl p-5 border border-white/15 flex flex-col justify-between gap-4"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-white/15 text-[#39b5e6] font-bold">
                  {f.categoria}
                </span>
                <span className={f.activo ? 'text-emerald-300 font-bold' : 'text-slate-400'}>
                  {f.activo ? 'Activo' : 'Pausado'}
                </span>
              </div>
              <h3 className="text-sm font-extrabold text-white mt-2">{f.titulo}</h3>
              <p className="text-xs text-slate-300 mt-1 line-clamp-2">{f.descripcion}</p>
              <p className="text-[11px] font-mono text-[#39b5e6] mt-2">/f/{f.slug}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {f.campos.length} campos · <strong className="text-white">{f.respuestasCount ?? 0}</strong> respuestas guardadas
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleViewRespuestas(f)}
                className="flex-1 px-3 py-1.5 rounded-lg bg-white text-[#371859] text-xs font-bold inline-flex items-center justify-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Respuestas
              </button>
              <button
                type="button"
                onClick={() => copyLink(f.slug)}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs inline-flex items-center gap-1"
                title="Copiar enlace público"
              >
                {copiedSlug === f.slug ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`/f/${f.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs inline-flex items-center"
                title="Abrir formulario"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => handleToggleActive(f)}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-semibold"
              >
                {f.activo ? 'Pausar' : 'Activar'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteForm(f)}
                className="px-2 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300"
                title="Archivar formulario"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Visor de respuestas guardadas en PostgreSQL */}
      {viewingForm && (
        <div className="glass-panel rounded-2xl p-6 border border-[#39b5e6]/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-white">
                Respuestas de &ldquo;{viewingForm.titulo}&rdquo; ({respuestas.length})
              </h3>
              <p className="text-xs text-slate-300">
                Almacenadas permanentemente en PostgreSQL · /f/{viewingForm.slug}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={respuestas.length === 0}
                onClick={exportCsv}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Excel / CSV
              </button>
              <button
                type="button"
                onClick={() => setViewingForm(null)}
                className="px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>

          {loadingResp ? (
            <p className="text-xs text-slate-300">Cargando respuestas...</p>
          ) : respuestas.length === 0 ? (
            <p className="text-xs text-slate-400">Todavía no hay respuestas registradas en este formulario.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/15 text-slate-300">
                    <th className="py-2 pr-4">Fecha</th>
                    {viewingForm.campos.map((c) => (
                      <th key={c.id} className="py-2 pr-4">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 text-white">
                  {respuestas.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2.5 pr-4 text-slate-400 whitespace-nowrap">
                        {new Date(r.createdAt).toLocaleString('es-AR')}
                      </td>
                      {viewingForm.campos.map((c) => {
                        const v = r.datos?.[c.id];
                        return (
                          <td key={c.id} className="py-2.5 pr-4 max-w-xs truncate">
                            {typeof v === 'boolean' ? (v ? 'Sí' : 'No') : String(v || '—')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
