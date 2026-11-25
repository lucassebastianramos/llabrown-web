'use client';

import React, { useState } from 'react';
import { UsuarioSistema } from '@/types';
import { KeyRound, Shield, UserCheck, UserPlus, UserX } from 'lucide-react';

interface UsuariosTabProps {
  usuarios: UsuarioSistema[];
  onRefresh: () => void;
}

export default function UsuariosTab({ usuarios, onRefresh }: UsuariosTabProps) {
  const [nuevo, setNuevo] = useState({
    username: '',
    nombre: '',
    cargo: 'Equipo Concejal LLA',
    role: 'editor' as 'admin' | 'editor',
    email: 'lalibertadavanza@llabrown.com.ar',
    password: '',
  });
  const [newPasses, setNewPasses] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevo),
    });
    const data = await res.json();
    if (res.ok) {
      setNuevo({
        username: '',
        nombre: '',
        cargo: 'Equipo Concejal LLA',
        role: 'editor',
        email: 'lalibertadavanza@llabrown.com.ar',
        password: '',
      });
      setMsg(`Cuenta @${data.username} creada correctamente.`);
      onRefresh();
    } else {
      setMsg(data.error || 'Error al crear la cuenta.');
    }
  };

  const handleResetPassword = async (id: string, username: string) => {
    const pwd = newPasses[id]?.trim();
    if (!pwd || pwd.length < 4) {
      setMsg('Ingresá una nueva clave de al menos 4 caracteres.');
      return;
    }
    const res = await fetch(`/api/usuarios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    if (res.ok) {
      setNewPasses((prev) => ({ ...prev, [id]: '' }));
      setMsg(`Clave actualizada para @${username}.`);
    }
  };

  const handleToggleActive = async (u: UsuarioSistema) => {
    const res = await fetch(`/api/usuarios/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !u.activo }),
    });
    if (res.ok) onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-2xl p-6 border border-purple-500/30 space-y-4">
        <div className="flex items-center gap-2 text-white">
          <UserPlus className="w-5 h-5 text-[#39b5e6]" />
          <div>
            <h2 className="text-base font-extrabold">Cuentas y Roles (Administradores vs. Concejales / Consejeros)</h2>
            <p className="text-xs text-slate-300">
              Cada concejal y consejero escolar ya tiene su cuenta <strong>Editor</strong> (solo sube noticias, expedientes y novedades a revisión; no puede eliminar nada). Solo los <strong>Administradores</strong> aprueban, rechazan o archivan contenidos.
            </p>
          </div>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs">
            {msg}
          </div>
        )}

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-6 gap-2.5 items-end">
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Usuario *</label>
            <input
              type="text"
              required
              value={nuevo.username}
              onChange={(e) => setNuevo({ ...nuevo, username: e.target.value })}
              placeholder="nombre.apellido"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Nombre completo *</label>
            <input
              type="text"
              required
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
              placeholder="Equipo Concejal..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Cargo</label>
            <input
              type="text"
              value={nuevo.cargo}
              onChange={(e) => setNuevo({ ...nuevo, cargo: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Rol</label>
            <select
              value={nuevo.role}
              onChange={(e) => setNuevo({ ...nuevo, role: e.target.value as 'admin' | 'editor' })}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            >
              <option value="editor">Editor (Concejal/Equipo · Sin borrar)</option>
              <option value="admin">Administrador (Control total)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Contraseña *</label>
            <input
              type="text"
              required
              value={nuevo.password}
              onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
              placeholder="Mín. 4 caracteres"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>
          <button
            type="submit"
            className="py-2 rounded-lg bg-white text-[#371859] font-extrabold text-xs"
          >
            Crear cuenta
          </button>
        </form>
      </div>

      {/* Tabla de cuentas existentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {usuarios.map((u) => (
          <div
            key={u.id}
            className={`glass-panel rounded-xl p-4 border flex flex-col gap-3 ${
              u.activo ? 'border-white/15' : 'border-white/5 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm text-white">{u.nombre}</strong>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      u.role === 'admin'
                        ? 'bg-[#39b5e6] text-[#120629]'
                        : 'bg-white/15 text-white'
                    }`}
                  >
                    {u.role === 'admin' ? 'Admin' : 'Concejal / Equipo'}
                  </span>
                </div>
                <p className="text-xs text-[#39b5e6] font-mono mt-0.5">@{u.username}</p>
                <p className="text-[11px] text-slate-300">{u.cargo}</p>
              </div>

              <button
                type="button"
                onClick={() => handleToggleActive(u)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white inline-flex items-center gap-1"
              >
                {u.activo ? (
                  <>
                    <UserX className="w-3.5 h-3.5 text-rose-300" /> Pausar
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-emerald-300" /> Activar
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
              <KeyRound className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={newPasses[u.id] || ''}
                onChange={(e) => setNewPasses({ ...newPasses, [u.id]: e.target.value })}
                placeholder="Definir nueva contraseña..."
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => handleResetPassword(u.id, u.username)}
                className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold"
              >
                Actualizar clave
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-xl bg-black/25 border border-white/10 text-xs text-slate-300 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-[#39b5e6] shrink-0 mt-0.5" />
        <span>
          Las contraseñas se almacenan cifradas con <code>scrypt + salt</code> en PostgreSQL. Podés entregarle a cada concejal y consejero escolar su usuario <code>@nombre.apellido</code> y restablecerle la clave desde aquí en cualquier momento.
        </span>
      </div>
    </div>
  );
}
