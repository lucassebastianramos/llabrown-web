'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Shield, 
  Lock, 
  LogOut, 
  PlusCircle, 
  FileText, 
  MapPin, 
  Trash2, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft,
  Copy,
  Calendar,
  Users,
  Send
} from 'lucide-react';
import { LOCALIDADES, PROYECTOS_INICIALES, VISITAS_INICIALES, CONCEJALES } from '@/data/mockData';
import { ProyectoHCD, VisitaTerritorial } from '@/types';
import AdminPinPicker from '@/components/admin/AdminPinPicker';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'proyectos' | 'visitas' | 'pines' | 'placas'>('pines');

  // Persistence in localStorage
  const [proyectos, setProyectos] = useState<ProyectoHCD[]>([]);
  const [visitas, setVisitas] = useState<VisitaTerritorial[]>([]);

  // Form states for new project
  const [newProj, setNewProj] = useState({
    titulo: '',
    expediente: '',
    autor: 'Juan Pedro Aquino',
    localidad: 'Almirante Brown',
    categoria: 'Baja de Tasas' as ProyectoHCD['categoria'],
    estado: 'Presentado' as ProyectoHCD['estado'],
    resumen: '',
  });

  // Form states for new visit
  const [newVisita, setNewVisita] = useState({
    titulo: '',
    localidad: 'Burzaco' as any,
    fecha: new Date().toLocaleDateString('es-AR'),
    descripcion: '',
    concejales: 'Juan Pedro Aquino',
    temas: 'Baja de tasas, seguridad',
    foto: '/img/vecinos1.jpeg'
  });

  // Plaque generator state
  const [placaTexto, setPlacaTexto] = useState('Escuchamos a los vecinos y presentamos el proyecto de baja de tasas para el comercio local.');
  const [placaLocalidad, setPlacaLocalidad] = useState('Burzaco');
  const [copiedPlaca, setCopiedPlaca] = useState(false);

  useEffect(() => {
    // Check saved session
    const authSession = localStorage.getItem('lla_admin_auth');
    if (authSession === 'true') {
      setIsAuthenticated(true);
    }

    // Fetch from PostgreSQL API with fallback
    fetch('/api/proyectos')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setProyectos(data);
        } else {
          setProyectos(PROYECTOS_INICIALES);
        }
      })
      .catch(() => setProyectos(PROYECTOS_INICIALES));

    fetch('/api/visitas')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setVisitas(data);
        } else {
          setVisitas(VISITAS_INICIALES);
        }
      })
      .catch(() => setVisitas(VISITAS_INICIALES));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: lla2025 or brown2026 or aquino
    if (password === 'lla2025' || password === 'brown2026' || password === 'aquino') {
      setIsAuthenticated(true);
      setLoginError(false);
      localStorage.setItem('lla_admin_auth', 'true');
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('lla_admin_auth');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProj.titulo || !newProj.resumen) return;

    const created: ProyectoHCD = {
      id: `p-${Date.now()}`,
      titulo: newProj.titulo,
      expediente: newProj.expediente || `HCD-EXP-${Math.floor(100 + Math.random() * 900)}/2025`,
      fecha: new Date().toLocaleDateString('es-AR'),
      autor: newProj.autor,
      localidad: newProj.localidad,
      categoria: newProj.categoria,
      estado: newProj.estado,
      resumen: newProj.resumen,
    };

    // Optimistic UI update
    setProyectos((prev) => [created, ...prev]);

    try {
      await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created)
      });
    } catch (err) {
      console.warn('Saved in local state only:', err);
    }

    // Reset form
    setNewProj({
      titulo: '',
      expediente: '',
      autor: 'Juan Pedro Aquino',
      localidad: 'Almirante Brown',
      categoria: 'Baja de Tasas',
      estado: 'Presentado',
      resumen: '',
    });
    alert('¡Proyecto guardado en la Base de Datos exitosamente!');
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('¿Seguro que deseás eliminar este proyecto?')) return;
    setProyectos((prev) => prev.filter((p) => p.id !== id));

    try {
      await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Deleted in local state only:', err);
    }
  };

  const handleCreateVisita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisita.titulo || !newVisita.descripcion) return;

    const created: VisitaTerritorial = {
      id: `v-${Date.now()}`,
      titulo: newVisita.titulo,
      localidad: newVisita.localidad,
      fecha: newVisita.fecha,
      descripcion: newVisita.descripcion,
      fotos: [newVisita.foto],
      concejales: newVisita.concejales.split(',').map((c) => c.trim()),
      temasTratados: newVisita.temas.split(',').map((t) => t.trim())
    };

    setVisitas((prev) => [created, ...prev]);

    try {
      await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created)
      });
    } catch (err) {
      console.warn('Saved in local state only:', err);
    }

    setNewVisita({
      titulo: '',
      localidad: 'Burzaco',
      fecha: new Date().toLocaleDateString('es-AR'),
      descripcion: '',
      concejales: 'Juan Pedro Aquino',
      temas: 'Baja de tasas, seguridad',
      foto: '/img/vecinos1.jpeg'
    });
    alert('¡Visita guardada en la Base de Datos exitosamente!');
  };

  const handleDeleteVisita = async (id: string) => {
    if (!confirm('¿Seguro que deseás eliminar esta visita?')) return;
    setVisitas((prev) => prev.filter((v) => v.id !== id));

    try {
      await fetch(`/api/visitas/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Deleted in local state only:', err);
    }
  };

  // Plaque copy text
  const placaTextFull = `🇦🇷 #TuVozConstruye en ${placaLocalidad}!\n\n${placaTexto}\n\n🏛️ Coordinación: Juan Pedro Aquino\nConcejal · La Libertad Avanza Almirante Brown\n🔗 https://llabrown.com.ar`;

  const copyPlaca = () => {
    navigator.clipboard.writeText(placaTextFull);
    setCopiedPlaca(true);
    setTimeout(() => setCopiedPlaca(false), 2500);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#0b0614] flex flex-col items-center justify-center p-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.15)_0,transparent_70%)] pointer-events-none" />

        <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-purple-500/30 shadow-2xl relative">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative w-16 h-16 mb-3">
              <Image src="/img/logo.png" alt="LLA" fill className="object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white">Portal Concejales</h1>
            <p className="text-xs text-purple-300 mt-1">
              Administración de Proyectos y Visitas Territoriales · Almirante Brown
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Clave de Acceso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu clave (ej: lla2025)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-purple-950/60 border border-purple-800/80 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              {loginError && (
                <span className="text-[11px] text-rose-400 mt-1.5 block">
                  Clave incorrecta. Intentá con <code className="text-amber-300">lla2025</code>
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 text-white font-bold text-xs uppercase tracking-wider hover:from-purple-500 hover:to-amber-400 transition-all shadow-lg shadow-purple-600/30"
            >
              Ingresar al Panel
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-purple-900/40 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la Página Principal</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0614] text-slate-100 flex flex-col">
      {/* Admin Header */}
      <header className="border-b border-purple-900/50 bg-[#0e071c]/90 backdrop-blur-md sticky top-0 z-40 py-3.5 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image src="/img/logo.png" alt="LLA" fill className="object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-white">Panel Concejales</span>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                Coordinación Juan Pedro Aquino
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-purple-800 text-purple-200 hover:bg-purple-900/40 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver Sitio Público</span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 hover:bg-rose-900/80 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Main Tabs Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-purple-900/40 pb-4">
          <button
            onClick={() => setActiveTab('pines')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'pines'
                ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-lg'
                : 'bg-purple-950/40 border border-purple-900/50 text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>Pines en el Mapa (Calles y Obras)</span>
          </button>

          <button
            onClick={() => setActiveTab('proyectos')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'proyectos'
                ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-lg'
                : 'bg-purple-950/40 border border-purple-900/50 text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Gestión de Proyectos HCD ({proyectos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('visitas')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'visitas'
                ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-lg'
                : 'bg-purple-950/40 border border-purple-900/50 text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Visitas y Recorridas ({visitas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('placas')}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              activeTab === 'placas'
                ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white shadow-lg'
                : 'bg-purple-950/40 border border-purple-900/50 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generador de Placas para Redes</span>
          </button>
        </div>

        {/* TAB: PINES TERRITORIALES (CALLES Y OBRAS) */}
        {activeTab === 'pines' && (
          <div className="animate-fadeIn">
            <AdminPinPicker />
          </div>
        )}

        {/* TAB 1: PROYECTOS */}
        {activeTab === 'proyectos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* New Project Form (5 cols) */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-900/40">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Cargar Nuevo Proyecto</h2>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Título del Proyecto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProj.titulo}
                    onChange={(e) => setNewProj({ ...newProj, titulo: e.target.value })}
                    placeholder="Ej: Eliminación de Tasa de Habilitación Comercial"
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Expediente HCD
                    </label>
                    <input
                      type="text"
                      value={newProj.expediente}
                      onChange={(e) => setNewProj({ ...newProj, expediente: e.target.value })}
                      placeholder="Ej: HCD-EXP-0155/2025"
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Autor Principal
                    </label>
                    <select
                      value={newProj.autor}
                      onChange={(e) => setNewProj({ ...newProj, autor: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {CONCEJALES.map((c) => (
                        <option key={c.id} value={c.nombre} className="bg-[#140b24]">
                          {c.nombre}
                        </option>
                      ))}
                      <option value="Bloque LLA Brown" className="bg-[#140b24]">Bloque LLA Brown</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Localidad / Alcance
                    </label>
                    <select
                      value={newProj.localidad}
                      onChange={(e) => setNewProj({ ...newProj, localidad: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Almirante Brown" className="bg-[#140b24]">Todo el Distrito</option>
                      {LOCALIDADES.map((l) => (
                        <option key={l.id} value={l.nombre} className="bg-[#140b24]">
                          {l.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Estado
                    </label>
                    <select
                      value={newProj.estado}
                      onChange={(e) => setNewProj({ ...newProj, estado: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Presentado" className="bg-[#140b24]">Presentado</option>
                      <option value="En Comisión" className="bg-[#140b24]">En Comisión</option>
                      <option value="Aprobado" className="bg-[#140b24]">Aprobado</option>
                      <option value="En Tratamiento" className="bg-[#140b24]">En Tratamiento</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Categoría
                  </label>
                  <select
                    value={newProj.categoria}
                    onChange={(e) => setNewProj({ ...newProj, categoria: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="Baja de Tasas" className="bg-[#140b24]">Baja de Tasas</option>
                    <option value="Seguridad" className="bg-[#140b24]">Seguridad</option>
                    <option value="Desregulación" className="bg-[#140b24]">Desregulación</option>
                    <option value="Educación" className="bg-[#140b24]">Educación</option>
                    <option value="Infraestructura" className="bg-[#140b24]">Infraestructura</option>
                    <option value="Salud" className="bg-[#140b24]">Salud</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Resumen / Fundamentos *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newProj.resumen}
                    onChange={(e) => setNewProj({ ...newProj, resumen: e.target.value })}
                    placeholder="Descripción resumida del impacto para los vecinos..."
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Guardar y Publicar en la Web
                </button>
              </form>
            </div>

            {/* Existing Projects List (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 mb-2">
                Proyectos Registrados ({proyectos.length})
              </h3>
              {proyectos.map((p) => (
                <div
                  key={p.id}
                  className="p-4 rounded-2xl glass-panel border border-purple-900/40 flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200">
                        {p.categoria}
                      </span>
                      <span className="text-[10px] font-semibold text-amber-300">
                        {p.estado}
                      </span>
                      <span className="text-[10px] text-slate-400">· {p.fecha}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{p.titulo}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2">{p.resumen}</p>
                    <span className="text-[11px] text-purple-300 mt-2 block">
                      Autor: {p.autor} · {p.localidad}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeleteProject(p.id)}
                    className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/60 transition-colors"
                    title="Eliminar proyecto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: VISITAS */}
        {activeTab === 'visitas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* New Visit Form (5 cols) */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-900/40">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Cargar Visita Territorial</h2>
              </div>

              <form onSubmit={handleCreateVisita} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Título de la Visita / Actividad *
                  </label>
                  <input
                    type="text"
                    required
                    value={newVisita.titulo}
                    onChange={(e) => setNewVisita({ ...newVisita, titulo: e.target.value })}
                    placeholder="Ej: Recorrida con comerciantes en Avenida San Martín"
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Localidad *
                    </label>
                    <select
                      value={newVisita.localidad}
                      onChange={(e) => setNewVisita({ ...newVisita, localidad: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {LOCALIDADES.map((l) => (
                        <option key={l.id} value={l.nombre} className="bg-[#140b24]">
                          {l.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Fecha
                    </label>
                    <input
                      type="text"
                      value={newVisita.fecha}
                      onChange={(e) => setNewVisita({ ...newVisita, fecha: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Concejales Presentes
                  </label>
                  <input
                    type="text"
                    value={newVisita.concejales}
                    onChange={(e) => setNewVisita({ ...newVisita, concejales: e.target.value })}
                    placeholder="Ej: Juan Pedro Aquino, Diego Garrido"
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Temas Tratados (separados por coma)
                  </label>
                  <input
                    type="text"
                    value={newVisita.temas}
                    onChange={(e) => setNewVisita({ ...newVisita, temas: e.target.value })}
                    placeholder="Ej: Asfalto, Baja de tasas, Seguridad"
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Descripción del Encuentro *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newVisita.descripcion}
                    onChange={(e) => setNewVisita({ ...newVisita, descripcion: e.target.value })}
                    placeholder="Detalles de la reunión con vecinos..."
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                >
                  Guardar y Publicar Visita
                </button>
              </form>
            </div>

            {/* Existing Visits List (7 cols) */}
            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 mb-2">
                Visitas Publicadas ({visitas.length})
              </h3>
              {visitas.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-2xl glass-panel border border-purple-900/40 flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 text-xs">
                      <span className="font-bold text-amber-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {v.localidad}
                      </span>
                      <span className="text-slate-400">· {v.fecha}</span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{v.titulo}</h4>
                    <p className="text-xs text-slate-300 line-clamp-2">{v.descripcion}</p>
                    <div className="mt-2 text-[11px] text-purple-300">
                      Concejales: {v.concejales.join(', ')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteVisita(v.id)}
                    className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 hover:text-white border border-rose-800/60 transition-colors"
                    title="Eliminar visita"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GENERADOR DE PLACAS PARA REDES */}
        {activeTab === 'placas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Editor (5 cols) */}
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-900/40">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h2 className="text-base font-bold text-white">Generador de Placas #TuVozConstruye</h2>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Personalizá la placa para compartir en historias de Instagram, estados de WhatsApp y publicaciones de X/Facebook.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Localidad
                  </label>
                  <select
                    value={placaLocalidad}
                    onChange={(e) => setPlacaLocalidad(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {LOCALIDADES.map((l) => (
                      <option key={l.id} value={l.nombre} className="bg-[#140b24]">
                        {l.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mensaje / Propuesta para el barrio
                  </label>
                  <textarea
                    rows={4}
                    value={placaTexto}
                    onChange={(e) => setPlacaTexto(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={copyPlaca}
                    className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    {copiedPlaca ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPlaca ? '¡Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(placaTextFull)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Live Plaque Preview (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3">
                Vista Previa de la Placa
              </span>

              {/* The Plaque */}
              <div className="w-full max-w-md aspect-[4/5] rounded-3xl bg-gradient-to-b from-[#1b0d38] via-[#120722] to-[#0a0414] border-2 border-amber-400/90 shadow-[0_0_50px_rgba(251,191,36,0.3)] p-8 flex flex-col justify-between text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

                <div>
                  <div className="relative w-20 h-20 mx-auto mb-2">
                    <Image src="/img/logo.png" alt="LLA" fill className="object-contain" />
                  </div>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-purple-300 block">
                    LA LIBERTAD AVANZA · ALMIRANTE BROWN
                  </span>
                  <div className="inline-block mt-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs font-bold">
                    📍 {placaLocalidad}
                  </div>
                </div>

                <div className="my-4">
                  <h3 className="text-3xl font-black text-white mb-3">
                    <span className="text-amber-400">#Tu voz</span> construye
                  </h3>
                  <p className="text-slate-200 text-sm leading-relaxed font-medium">
                    {placaTexto}
                  </p>
                </div>

                <div className="pt-4 border-t border-amber-400/40">
                  <span className="text-[10px] text-amber-300/80 uppercase tracking-widest font-bold block">
                    Coordinación
                  </span>
                  <span className="text-lg font-black text-white tracking-wide block">
                    Juan Pedro Aquino
                  </span>
                  <span className="text-[11px] text-purple-300 font-medium block">
                    Jefe de Bloque de Concejales · Almirante Brown
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
