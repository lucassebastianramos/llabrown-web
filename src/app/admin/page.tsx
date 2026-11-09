'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
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
  Send,
  Scale,
  Building2,
  ExternalLink,
  MessageCircle,
  Upload,
} from 'lucide-react';
import { LOCALIDADES, PROYECTOS_INICIALES, VISITAS_INICIALES, CONCEJALES } from '@/data/mockData';
import { ProyectoHCD, VisitaTerritorial, ReclamoVecinal } from '@/types';
import AdminPinPicker from '@/components/admin/AdminPinPicker';
import { getDigestoSearchUrl } from '@/lib/digestoService';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'proyectos' | 'visitas' | 'pines' | 'placas' | 'reclamos'>('reclamos');

  const [proyectos, setProyectos] = useState<ProyectoHCD[]>([]);
  const [visitas, setVisitas] = useState<VisitaTerritorial[]>([]);
  const [reclamos, setReclamos] = useState<ReclamoVecinal[]>([]);
  const [editingMunicipalNumbers, setEditingMunicipalNumbers] = useState<Record<string, string>>({});
  const [savingReclamoId, setSavingReclamoId] = useState<string | null>(null);

  const [newProj, setNewProj] = useState({
    titulo: '',
    expediente: '',
    archivoPdf: '',
    archivoNombre: '',
    autor: 'Juan Pedro Aquino',
    localidad: 'Almirante Brown',
    categoria: 'Baja de Tasas' as ProyectoHCD['categoria'],
    estado: 'Presentado' as ProyectoHCD['estado'],
    resumen: '',
  });
  const [uploadingPdf, setUploadingPdf] = useState(false);

  const [newVisita, setNewVisita] = useState({
    titulo: '',
    localidad: 'Burzaco' as any,
    fecha: new Date().toLocaleDateString('es-AR'),
    descripcion: '',
    concejales: 'Juan Pedro Aquino',
    temas: 'Baja de tasas, seguridad',
    foto: '/img/vecinos1.jpeg',
  });

  const [placaTexto, setPlacaTexto] = useState(
    'Escuchamos a los vecinos y presentamos el proyecto de baja de tasas para el comercio local.'
  );
  const [placaLocalidad, setPlacaLocalidad] = useState('Burzaco');
  const [copiedPlaca, setCopiedPlaca] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => (res.ok ? res.json() : { authenticated: false }))
      .then((data) => {
        if (data?.authenticated) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('lla_admin_auth');
        }
      })
      .catch(() => {});

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

  useEffect(() => {
    if (!isAuthenticated) return;
    fetch('/api/reclamos')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setReclamos(data);
          const initialEditing: Record<string, string> = {};
          data.forEach((r) => {
            if (r.numeroReclamoMunicipal) {
              initialEditing[r.id] = r.numeroReclamoMunicipal;
            }
          });
          setEditingMunicipalNumbers(initialEditing);
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleSaveNumeroMunicipal = async (id: string) => {
    const num = editingMunicipalNumbers[id];
    if (!num) return;
    setSavingReclamoId(id);
    try {
      const res = await fetch(`/api/reclamos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeroReclamoMunicipal: num,
          estado: 'Enviado a BrownGestión',
        }),
      });
      if (res.ok) {
        setReclamos((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, numeroReclamoMunicipal: num, estado: 'Enviado a BrownGestión' } : r
          )
        );
        alert('¡Número de reclamo municipal guardado exitosamente!');
      } else {
        alert('Error al guardar número de reclamo.');
      }
    } catch (e) {
      alert('Error de conexión.');
    } finally {
      setSavingReclamoId(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsAuthenticated(true);
        setLoginError(false);
        setPassword('');
      } else {
        setLoginError(true);
      }
    } catch {
      setLoginError(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth', { method: 'DELETE' });
    } catch {}
    setIsAuthenticated(false);
    localStorage.removeItem('lla_admin_auth');
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      alert('Por favor, seleccioná un archivo en formato PDF.');
      return;
    }

    setUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setNewProj((prev) => ({
          ...prev,
          archivoPdf: data.url,
          archivoNombre: data.originalName || file.name,
        }));
      } else {
        alert('Error al subir el PDF: ' + (data.error || 'Desconocido'));
      }
    } catch (err) {
      alert('Error de conexión al subir el archivo');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProj.titulo || !newProj.resumen) return;

    const created: ProyectoHCD = {
      id: `p-${Date.now()}`,
      titulo: newProj.titulo,
      expediente: newProj.expediente || `HCD-EXP-${Math.floor(100 + Math.random() * 900)}/2025`,
      archivoPdf: newProj.archivoPdf || undefined,
      archivoNombre: newProj.archivoNombre || undefined,
      fecha: new Date().toLocaleDateString('es-AR'),
      autor: newProj.autor,
      localidad: newProj.localidad,
      categoria: newProj.categoria,
      estado: newProj.estado,
      resumen: newProj.resumen,
    };

    setProyectos((prev) => [created, ...prev]);

    try {
      await fetch('/api/proyectos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created),
      });
    } catch (err) {
      console.warn('Saved in local state only:', err);
    }

    setNewProj({
      titulo: '',
      expediente: '',
      archivoPdf: '',
      archivoNombre: '',
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
      temasTratados: newVisita.temas.split(',').map((t) => t.trim()),
    };

    setVisitas((prev) => [created, ...prev]);

    try {
      await fetch('/api/visitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(created),
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
      foto: '/img/vecinos1.jpeg',
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

  const placaTextFull = `🇦🇷 #TuVozConstruye en ${placaLocalidad}\n\n${placaTexto}\n\nCoordinación: Juan Pedro Aquino\nConcejal · La Libertad Avanza Almirante Brown\nhttps://llabrown.com.ar`;

  const copyPlaca = () => {
    navigator.clipboard.writeText(placaTextFull);
    setCopiedPlaca(true);
    setTimeout(() => setCopiedPlaca(false), 2500);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#230552] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white text-[#1d1d1d] rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-full py-4 px-6 rounded-xl bg-[#371859] mb-4 flex justify-center">
              <div className="relative w-44 h-12 overflow-hidden">
                <Image
                  src="/img/logo.png"
                  alt="La Libertad Avanza Almirante Brown"
                  fill
                  className="object-contain object-[50%_40%] scale-[1.55]"
                />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1d1d1d]">Portal Concejales</h1>
            <p className="text-xs text-slate-600 mt-1">
              Administración de Proyectos, Reclamos y Visitas · Almirante Brown
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Clave de Acceso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6c4c99] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresá tu clave institucional"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859]"
                />
              </div>
              {loginError && (
                <span className="text-[11px] text-rose-600 font-semibold mt-1.5 block">
                  Clave incorrecta. Verificá tu acceso con coordinación.
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Ingresar al Panel
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-[#371859] flex items-center justify-center gap-1.5 transition-colors"
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
    <main className="min-h-screen bg-[#120629] text-slate-100 flex flex-col">
      {/* Header Admin Institucional */}
      <header className="border-b border-white/10 bg-[#371859] sticky top-0 z-40 py-3 px-4 sm:px-8 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-36 h-10 overflow-hidden">
              <Image
                src="/img/logo.png"
                alt="La Libertad Avanza"
                fill
                className="object-contain object-[0%_40%] scale-[1.55] origin-left"
              />
            </div>
            <div className="hidden sm:flex flex-col border-l border-white/20 pl-3">
              <span className="text-sm font-extrabold text-white">Panel Concejales</span>
              <span className="text-[10px] text-[#39b5e6] font-semibold uppercase tracking-wider">
                Coordinación Juan Pedro Aquino
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="text-xs font-bold px-3.5 py-2 rounded-lg bg-white text-[#371859] hover:bg-slate-100 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Ver Sitio Público</span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-xs font-semibold px-3 py-2 rounded-lg border border-white/25 text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* Contenedor Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Pestañas */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-purple-900/50 pb-4">
          <button
            onClick={() => setActiveTab('pines')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
              activeTab === 'pines'
                ? 'bg-white text-[#371859] shadow-md'
                : 'bg-purple-950/50 border border-purple-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Pines en el Mapa</span>
          </button>

          <button
            onClick={() => setActiveTab('reclamos')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
              activeTab === 'reclamos'
                ? 'bg-white text-[#371859] shadow-md'
                : 'bg-purple-950/50 border border-purple-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Auditoría de Reclamos ({reclamos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('proyectos')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
              activeTab === 'proyectos'
                ? 'bg-white text-[#371859] shadow-md'
                : 'bg-purple-950/50 border border-purple-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Proyectos HCD ({proyectos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('visitas')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
              activeTab === 'visitas'
                ? 'bg-white text-[#371859] shadow-md'
                : 'bg-purple-950/50 border border-purple-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Visitas y Recorridas ({visitas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('placas')}
            className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors ${
              activeTab === 'placas'
                ? 'bg-white text-[#371859] shadow-md'
                : 'bg-purple-950/50 border border-purple-800/60 text-slate-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generador de Placas</span>
          </button>
        </div>

        {/* TAB: PINES */}
        {activeTab === 'pines' && (
          <div className="animate-fadeIn">
            <AdminPinPicker />
          </div>
        )}

        {/* TAB: PROYECTOS */}
        {activeTab === 'proyectos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-900/40">
                <PlusCircle className="w-5 h-5 text-[#39b5e6]" />
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
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
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
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Autor Principal
                    </label>
                    <select
                      value={newProj.autor}
                      onChange={(e) => setNewProj({ ...newProj, autor: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                    >
                      {CONCEJALES.map((c) => (
                        <option key={c.id} value={c.nombre} className="bg-[#140b24]">
                          {c.nombre}
                        </option>
                      ))}
                      <option value="Bloque LLA Brown" className="bg-[#140b24]">
                        Bloque LLA Brown
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Documento / PDF del Expediente (Opcional)
                  </label>
                  {newProj.archivoPdf ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-purple-950/80 border border-sky-400/50">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="w-4 h-4 text-[#39b5e6] shrink-0" />
                        <span className="text-xs text-[#39b5e6] truncate font-mono">
                          {newProj.archivoNombre || 'expediente.pdf'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={newProj.archivoPdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:text-white text-[11px] font-bold flex items-center gap-1"
                        >
                          <span>Ver</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setNewProj({ ...newProj, archivoPdf: '', archivoNombre: '' })}
                          className="px-2 py-1 rounded-lg bg-rose-950/60 text-rose-300 hover:text-white text-[11px] font-semibold"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-purple-700/80 bg-purple-950/40 hover:bg-purple-900/50 hover:border-[#39b5e6] cursor-pointer transition-all text-xs text-slate-300">
                        <Upload className="w-4 h-4 text-[#39b5e6]" />
                        <span>{uploadingPdf ? 'Subiendo PDF...' : 'Subir archivo PDF del expediente'}</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          disabled={uploadingPdf}
                          onChange={handlePdfUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Si subís el PDF se abre directo con un clic. Si no lo subís, se busca automáticamente en el Digesto Oficial del HCD con el número de expediente.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Localidad / Alcance
                    </label>
                    <select
                      value={newProj.localidad}
                      onChange={(e) => setNewProj({ ...newProj, localidad: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                    >
                      <option value="Almirante Brown" className="bg-[#140b24]">
                        Todo el Distrito
                      </option>
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
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                    >
                      <option value="Presentado" className="bg-[#140b24]">
                        Presentado
                      </option>
                      <option value="En Comisión" className="bg-[#140b24]">
                        En Comisión
                      </option>
                      <option value="Aprobado" className="bg-[#140b24]">
                        Aprobado
                      </option>
                      <option value="En Tratamiento" className="bg-[#140b24]">
                        En Tratamiento
                      </option>
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
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                  >
                    <option value="Baja de Tasas" className="bg-[#140b24]">
                      Baja de Tasas
                    </option>
                    <option value="Seguridad" className="bg-[#140b24]">
                      Seguridad
                    </option>
                    <option value="Desregulación" className="bg-[#140b24]">
                      Desregulación
                    </option>
                    <option value="Educación" className="bg-[#140b24]">
                      Educación
                    </option>
                    <option value="Infraestructura" className="bg-[#140b24]">
                      Infraestructura
                    </option>
                    <option value="Salud" className="bg-[#140b24]">
                      Salud
                    </option>
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
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#371859] font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                >
                  Guardar y Publicar en la Web
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300 mb-2">
                Proyectos Registrados ({proyectos.length})
              </h3>
              {proyectos.map((p) => {
                const digestoUrl = getDigestoSearchUrl(p.expediente, p.titulo);

                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl glass-panel border border-purple-900/40 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-200">
                          {p.categoria}
                        </span>
                        <span className="text-[10px] font-semibold text-[#39b5e6]">
                          {p.estado}
                        </span>
                        <span className="text-[10px] text-slate-400">· {p.fecha}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">{p.titulo}</h4>

                      <div className="flex flex-wrap items-center gap-2 my-2">
                        {p.expediente && (
                          <span className="text-[11px] font-mono text-[#39b5e6] bg-sky-500/10 px-2 py-0.5 rounded border border-sky-400/30 font-bold">
                            {p.expediente}
                          </span>
                        )}

                        {p.archivoPdf && (
                          <a
                            href={p.archivoPdf}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-white hover:bg-purple-800/60 bg-purple-900/60 px-2 py-0.5 rounded border border-purple-500/40 flex items-center gap-1 font-semibold transition-colors"
                          >
                            <FileText className="w-3 h-3 text-[#39b5e6]" />
                            <span>Ver PDF</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}

                        <a
                          href={digestoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-purple-300 hover:text-white bg-purple-950/60 hover:bg-purple-900/60 px-2 py-0.5 rounded border border-purple-800/60 flex items-center gap-1 transition-colors"
                          title="Probar búsqueda en Digesto Oficial HCD"
                        >
                          <span>Digesto HCD</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>

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
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: VISITAS */}
        {activeTab === 'visitas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-900/40">
                <PlusCircle className="w-5 h-5 text-[#39b5e6]" />
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
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
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
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
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
                      className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#371859] font-bold text-xs uppercase tracking-wider transition-colors shadow-md"
                >
                  Guardar y Publicar Visita
                </button>
              </form>
            </div>

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
                      <span className="font-bold text-[#39b5e6] flex items-center gap-1">
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

        {/* TAB: GENERADOR DE PLACAS OFICIALES */}
        {activeTab === 'placas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-purple-900/40">
                <Sparkles className="w-5 h-5 text-[#39b5e6]" />
                <h2 className="text-base font-bold text-white">Generador de Placas #TuVozConstruye</h2>
              </div>
              <p className="text-xs text-slate-300 mb-4">
                Personalizá la placa institucional con la paleta oficial de La Libertad Avanza Nacional para compartir en redes y WhatsApp.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Localidad
                  </label>
                  <select
                    value={placaLocalidad}
                    onChange={(e) => setPlacaLocalidad(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
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
                    className="w-full px-3.5 py-2 rounded-xl bg-purple-950/60 border border-purple-800 text-xs text-white focus:outline-none focus:border-[#39b5e6]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={copyPlaca}
                    className="flex-1 py-2.5 rounded-xl bg-[#6c4c99] hover:bg-[#371859] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md"
                  >
                    {copiedPlaca ? <CheckCircle2 className="w-4 h-4 text-sky-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPlaca ? '¡Copiado!' : 'Copiar Texto'}</span>
                  </button>

                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(placaTextFull)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#371859] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 mb-3">
                Vista Previa Institucional
              </span>

              <div className="w-full max-w-md aspect-[4/5] rounded-2xl bg-gradient-to-b from-[#371859] to-[#230552] border-2 border-white/80 shadow-2xl p-8 flex flex-col justify-between text-center relative overflow-hidden">
                <div>
                  <div className="relative w-52 h-16 mx-auto mb-2 overflow-hidden">
                    <Image
                      src="/img/logo.png"
                      alt="La Libertad Avanza Almirante Brown"
                      fill
                      className="object-contain object-[50%_40%] scale-[1.55]"
                    />
                  </div>
                  <div className="inline-block mt-3 px-3.5 py-1 rounded-full bg-white/15 border border-white/25 text-white text-xs font-bold">
                    {placaLocalidad}
                  </div>
                </div>

                <div className="my-4">
                  <h3 className="text-3xl font-extrabold text-white mb-3">
                    <span className="text-[#39b5e6]">#TuVoz</span>Construye
                  </h3>
                  <p className="text-white/90 text-sm leading-relaxed font-medium">
                    {placaTexto}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <span className="text-[10px] text-[#39b5e6] uppercase tracking-widest font-bold block">
                    Coordinación
                  </span>
                  <span className="text-lg font-extrabold text-white tracking-wide block">
                    Juan Pedro Aquino
                  </span>
                  <span className="text-[11px] text-white/75 font-medium block">
                    Jefe de Bloque de Concejales · Almirante Brown
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AUDITORÍA DE RECLAMOS */}
        {activeTab === 'reclamos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-6 rounded-3xl glass-panel border border-purple-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">Mesa de Auditoría y Reclamos Vecinales</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold border border-sky-400/40">
                    {reclamos.length} Recibidos
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Reclamos ingresados por los vecinos desde la plataforma web. Cada caso se audita formalmente y se ingresa a <strong>Solicitudes Brown</strong> bajo el patrocinio del Concejal Juan Pedro Aquino.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href="https://www.browngestion.ar/solicitudesciudadanas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#39b5e6]" />
                  <span>Solicitudes Brown</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <a
                  href="https://a.brown.gob.ar/hcd/digesto"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl bg-purple-950/80 hover:bg-purple-900 border border-purple-700 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                >
                  <Scale className="w-3.5 h-3.5 text-[#39b5e6]" />
                  <span>Digesto HCD</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>

                <button
                  onClick={() => {
                    fetch('/api/reclamos')
                      .then((res) => (res.ok ? res.json() : []))
                      .then((data) => {
                        if (Array.isArray(data)) setReclamos(data);
                      });
                  }}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#371859] font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Actualizar Lista
                </button>
              </div>
            </div>

            {reclamos.length === 0 ? (
              <div className="text-center py-16 glass-panel rounded-3xl border border-purple-900/40 text-slate-400">
                <Scale className="w-12 h-12 mx-auto text-[#6c4c99] mb-3" />
                <p className="text-sm font-semibold text-white">No hay reclamos registrados aún.</p>
                <p className="text-xs text-slate-400 mt-1">
                  Los reclamos ingresados desde la sección pública aparecerán aquí para su gestión legislativa.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {reclamos.map((rec) => {
                  const numMunicipal =
                    editingMunicipalNumbers[rec.id] !== undefined
                      ? editingMunicipalNumbers[rec.id]
                      : rec.numeroReclamoMunicipal || '';

                  const cleanPhone = rec.telefonoVecino.replace(/\D/g, '');
                  const waNeighborUrl = `https://wa.me/549${cleanPhone}?text=${encodeURIComponent(
                    `Hola ${rec.nombreVecino}, te contactamos desde el equipo del Concejal Juan Pedro Aquino (La Libertad Avanza Almirante Brown) por tu reclamo ${rec.codigoSeguimiento} sobre "${rec.tipoReclamo}" en ${rec.calle}.` +
                      (rec.numeroReclamoMunicipal
                        ? ` Te informamos que fue ingresado formalmente ante el Municipio con el N° de Reclamo Oficial ${rec.numeroReclamoMunicipal}.`
                        : ' Estamos gestionando su auditoría.')
                  )}`;

                  return (
                    <div
                      key={rec.id}
                      className="p-6 rounded-2xl glass-panel border border-purple-500/25 hover:border-purple-500/50 transition-all shadow-xl space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-purple-900/40">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-xs text-[#39b5e6] bg-purple-950/80 px-2.5 py-1 rounded-lg border border-purple-800">
                            {rec.codigoSeguimiento}
                          </span>
                          <span className="text-xs font-bold text-white">{rec.tipoReclamo}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400">{rec.fecha}</span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              rec.numeroReclamoMunicipal
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
                                : 'bg-purple-900/40 text-purple-200 border border-purple-700/60'
                            }`}
                          >
                            {rec.numeroReclamoMunicipal ? `N° Mun: ${rec.numeroReclamoMunicipal}` : rec.estado}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs">
                        <div className="md:col-span-4 p-3.5 rounded-xl bg-purple-950/50 border border-purple-900/40 space-y-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Datos del Vecino
                          </span>
                          <p className="font-bold text-white text-sm">
                            {rec.nombreVecino} {rec.apellidoVecino || ''}
                          </p>
                          <div className="space-y-1 text-slate-300">
                            <p className="flex items-center gap-1.5">
                              <span className="text-[#39b5e6] font-semibold">Teléfono:</span> {rec.telefonoVecino}
                            </p>
                            {rec.dniVecino && (
                              <p className="flex items-center gap-1.5">
                                <span className="text-[#39b5e6] font-semibold">DNI:</span> {rec.dniVecino}
                              </p>
                            )}
                          </div>

                          <div className="pt-2">
                            <a
                              href={waNeighborUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Escribir por WhatsApp</span>
                            </a>
                          </div>
                        </div>

                        <div className="md:col-span-5 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Ubicación en Almirante Brown
                            </span>
                            <p className="font-semibold text-white mt-0.5">
                              {rec.calle} {rec.altura || 'S/N'} {rec.entreCalles ? `(${rec.entreCalles})` : ''}
                            </p>
                            <p className="text-[11px] text-purple-300">
                              {rec.barrio ? `Barrio ${rec.barrio} · ` : ''}
                              {rec.localidad}
                            </p>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Descripción del Reclamo
                            </span>
                            <p className="text-slate-200 text-xs mt-0.5 leading-relaxed bg-purple-950/50 p-2.5 rounded-xl border border-purple-900/30">
                              {rec.descripcion}
                            </p>
                          </div>

                          {rec.normaDigesto && (
                            <p className="text-[11px] text-[#39b5e6] bg-sky-500/10 px-2.5 py-1 rounded-lg border border-sky-400/20">
                              <strong>Digesto HCD:</strong> {rec.normaDigesto}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-3 p-3.5 rounded-xl bg-purple-950/50 border border-purple-900/40 flex flex-col justify-between space-y-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              N° Reclamo Municipal
                            </span>
                            <input
                              type="text"
                              value={numMunicipal}
                              onChange={(e) =>
                                setEditingMunicipalNumbers((prev) => ({ ...prev, [rec.id]: e.target.value }))
                              }
                              placeholder="Ej: 148902"
                              className="w-full px-3 py-1.5 rounded-lg bg-purple-950/80 border border-purple-800 text-white font-mono text-xs focus:outline-none focus:border-[#39b5e6]"
                            />
                            <button
                              onClick={() => handleSaveNumeroMunicipal(rec.id)}
                              disabled={savingReclamoId === rec.id}
                              className="w-full mt-2 py-1.5 rounded-lg bg-[#6c4c99] hover:bg-[#371859] text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3 text-[#39b5e6]" />
                              <span>{savingReclamoId === rec.id ? 'Guardando...' : 'Guardar N° Oficial'}</span>
                            </button>
                          </div>

                          <div className="pt-2 border-t border-purple-900/40">
                            <span className="text-[10px] text-slate-400 block mb-1">Patrocinado por:</span>
                            <span className="text-[11px] font-bold text-white block">
                              Juan Pedro Aquino
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
