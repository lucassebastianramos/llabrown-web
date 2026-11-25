'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Newspaper,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { LOCALIDADES } from '@/data/mockData';
import { DEFAULT_SITE_CONFIG } from '@/data/seedDefaults';
import {
  FormularioDinamico,
  LocalidadInfo,
  MiembroEquipo,
  NoticiaItem,
  ProyectoHCD,
  ReclamoVecinal,
  SessionUser,
  SiteConfig,
  UsuarioSistema,
  VisitaTerritorial,
} from '@/types';
import AdminPinPicker from '@/components/admin/AdminPinPicker';
import ConfirmPublishModal, { ConfirmPreviewData } from '@/components/admin/ConfirmPublishModal';
import AprobacionesTab from '@/components/admin/AprobacionesTab';
import NoticiasTab from '@/components/admin/NoticiasTab';
import EquipoAdminTab from '@/components/admin/EquipoAdminTab';
import FormulariosTab from '@/components/admin/FormulariosTab';
import LocalidadesConfigTab from '@/components/admin/LocalidadesConfigTab';
import CorreosZohoTab from '@/components/admin/CorreosZohoTab';
import UsuariosTab from '@/components/admin/UsuariosTab';
import { getDigestoSearchUrl } from '@/lib/digestoService';

type AdminTabId =
  | 'aprobaciones'
  | 'reclamos'
  | 'noticias'
  | 'proyectos'
  | 'visitas'
  | 'pines'
  | 'equipo'
  | 'formularios'
  | 'correos'
  | 'localidades'
  | 'usuarios';

export default function AdminPage() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<AdminTabId>('aprobaciones');

  // Datos cargados desde PostgreSQL
  const [noticias, setNoticias] = useState<NoticiaItem[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoHCD[]>([]);
  const [visitas, setVisitas] = useState<VisitaTerritorial[]>([]);
  const [reclamos, setReclamos] = useState<ReclamoVecinal[]>([]);
  const [equipo, setEquipo] = useState<MiembroEquipo[]>([]);
  const [localidades, setLocalidades] = useState<LocalidadInfo[]>(LOCALIDADES);
  const [formularios, setFormularios] = useState<FormularioDinamico[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);

  const [editingMunicipalNumbers, setEditingMunicipalNumbers] = useState<Record<string, string>>({});
  const [savingReclamoId, setSavingReclamoId] = useState<string | null>(null);

  // Estado formulario Proyectos HCD
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

  // Estado formulario Visitas / Recorridas
  const [newVisita, setNewVisita] = useState({
    titulo: '',
    localidad: 'Burzaco',
    fecha: new Date().toLocaleDateString('es-AR'),
    descripcion: '',
    concejales: 'Juan Pedro Aquino',
    temas: 'Baja de tasas, seguridad',
    foto: '/img/vecinos1.jpeg',
  });
  const [uploadingVisitaFoto, setUploadingVisitaFoto] = useState(false);

  // Modal de confirmación anti-errores para Proyectos y Visitas
  const [confirmKind, setConfirmKind] = useState<'proyecto' | 'visita' | null>(null);
  const [submittingConfirm, setSubmittingConfirm] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState('');

  const refreshData = useCallback(async (currentUser: SessionUser) => {
    const isAdmin = currentUser.role === 'admin';

    const [notRes, proyRes, visRes, locRes, cfgRes] = await Promise.all([
      fetch('/api/noticias?scope=all').catch(() => null),
      fetch('/api/proyectos?scope=all').catch(() => null),
      fetch('/api/visitas?scope=all').catch(() => null),
      fetch(isAdmin ? '/api/localidades?scope=all' : '/api/localidades').catch(() => null),
      fetch('/api/config').catch(() => null),
    ]);

    if (notRes?.ok) setNoticias(await notRes.json());
    if (proyRes?.ok) setProyectos(await proyRes.json());
    if (visRes?.ok) setVisitas(await visRes.json());
    if (locRes?.ok) {
      const locs = await locRes.json();
      if (Array.isArray(locs) && locs.length > 0) setLocalidades(locs);
    }
    if (cfgRes?.ok) {
      const c = await cfgRes.json();
      if (c?.heroTitulo) setConfig(c);
    }

    if (isAdmin) {
      const [recRes, eqRes, formRes, usrRes] = await Promise.all([
        fetch('/api/reclamos').catch(() => null),
        fetch('/api/equipo?scope=all').catch(() => null),
        fetch('/api/formularios?scope=all').catch(() => null),
        fetch('/api/usuarios').catch(() => null),
      ]);

      if (recRes?.ok) {
        const recs = await recRes.json();
        if (Array.isArray(recs)) {
          setReclamos(recs);
          const initNums: Record<string, string> = {};
          recs.forEach((r: ReclamoVecinal) => {
            if (r.numeroReclamoMunicipal) initNums[r.id] = r.numeroReclamoMunicipal;
          });
          setEditingMunicipalNumbers(initNums);
        }
      }
      if (eqRes?.ok) setEquipo(await eqRes.json());
      if (formRes?.ok) setFormularios(await formRes.json());
      if (usrRes?.ok) setUsuarios(await usrRes.json());
    }
  }, []);

  useEffect(() => {
    fetch('/api/admin/auth')
      .then((res) => (res.ok ? res.json() : { authenticated: false, user: null }))
      .then((data) => {
        if (data?.authenticated && data.user) {
          setUser(data.user);
          setActiveTab(data.user.role === 'admin' ? 'aprobaciones' : 'noticias');
          setNewProj((p) => ({ ...p, autor: data.user.nombre }));
          setNewVisita((v) => ({ ...v, concejales: data.user.nombre }));
          refreshData(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setCheckingAuth(false));
  }, [refreshData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.user) {
        setUser(data.user);
        setPassword('');
        setActiveTab(data.user.role === 'admin' ? 'aprobaciones' : 'noticias');
        setNewProj((p) => ({ ...p, autor: data.user.nombre }));
        setNewVisita((v) => ({ ...v, concejales: data.user.nombre }));
        refreshData(data.user);
      } else {
        setLoginError(data.error || 'Usuario o contraseña incorrectos.');
      }
    } catch {
      setLoginError('Error de conexión con el servidor.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' }).catch(() => {});
    setUser(null);
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setFeedbackBanner('Seleccioná un archivo en formato PDF válido.');
      return;
    }
    setUploadingPdf(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setNewProj((prev) => ({
          ...prev,
          archivoPdf: data.url,
          archivoNombre: data.originalName || file.name,
        }));
      } else {
        setFeedbackBanner(data.error || 'Error al subir PDF.');
      }
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleVisitaPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingVisitaFoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setNewVisita((prev) => ({ ...prev, foto: data.url }));
      }
    } finally {
      setUploadingVisitaFoto(false);
    }
  };

  const handleConfirmedCreate = async () => {
    if (!user || !confirmKind) return;
    setSubmittingConfirm(true);
    setFeedbackBanner('');

    try {
      if (confirmKind === 'proyecto') {
        const res = await fetch('/api/proyectos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `p-${Date.now()}`,
            titulo: newProj.titulo,
            expediente: newProj.expediente || `HCD-EXP-${Math.floor(100 + Math.random() * 900)}/2026`,
            archivoPdf: newProj.archivoPdf || undefined,
            archivoNombre: newProj.archivoNombre || undefined,
            fecha: new Date().toLocaleDateString('es-AR'),
            autor: newProj.autor,
            localidad: newProj.localidad,
            categoria: newProj.categoria,
            estado: newProj.estado,
            resumen: newProj.resumen,
          }),
        });
        if (res.ok) {
          setNewProj({
            titulo: '',
            expediente: '',
            archivoPdf: '',
            archivoNombre: '',
            autor: user.nombre,
            localidad: 'Almirante Brown',
            categoria: 'Baja de Tasas',
            estado: 'Presentado',
            resumen: '',
          });
          setConfirmKind(null);
          setFeedbackBanner(
            user.role === 'admin'
              ? 'Expediente publicado y respaldado en PostgreSQL.'
              : 'Expediente enviado a revisión de los Administradores. Quedó respaldado en la base de datos.'
          );
          refreshData(user);
        }
      } else if (confirmKind === 'visita') {
        const res = await fetch('/api/visitas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `v-${Date.now()}`,
            titulo: newVisita.titulo,
            localidad: newVisita.localidad,
            fecha: newVisita.fecha,
            descripcion: newVisita.descripcion,
            fotos: [newVisita.foto],
            concejales: newVisita.concejales.split(',').map((c) => c.trim()).filter(Boolean),
            temasTratados: newVisita.temas.split(',').map((t) => t.trim()).filter(Boolean),
          }),
        });
        if (res.ok) {
          setNewVisita({
            titulo: '',
            localidad: 'Burzaco',
            fecha: new Date().toLocaleDateString('es-AR'),
            descripcion: '',
            concejales: user.nombre,
            temas: 'Baja de tasas, seguridad',
            foto: '/img/vecinos1.jpeg',
          });
          setConfirmKind(null);
          setFeedbackBanner(
            user.role === 'admin'
              ? 'Recorrida publicada y respaldada en PostgreSQL.'
              : 'Recorrida enviada a revisión de los Administradores. Aparecerá en la web una vez aprobada.'
          );
          refreshData(user);
        }
      }
    } finally {
      setSubmittingConfirm(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!user || user.role !== 'admin') return;
    if (!confirm('¿Quitar este expediente de la web? Quedará respaldado en la base de datos.')) return;
    const res = await fetch(`/api/proyectos/${id}`, { method: 'DELETE' });
    if (res.ok) refreshData(user);
  };

  const handleDeleteVisita = async (id: string) => {
    if (!user || user.role !== 'admin') return;
    if (!confirm('¿Quitar esta recorrida de la web? Quedará respaldada en la base de datos.')) return;
    const res = await fetch(`/api/visitas/${id}`, { method: 'DELETE' });
    if (res.ok) refreshData(user);
  };

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
          estado: 'Enviado a Gestión Municipal',
        }),
      });
      if (res.ok && user) {
        setFeedbackBanner(`Número municipal ${num} guardado en el reclamo.`);
        refreshData(user);
      }
    } finally {
      setSavingReclamoId(null);
    }
  };

  const pendingCount =
    noticias.filter((n) => !n.deletedAt && n.estadoAprobacion === 'pendiente').length +
    proyectos.filter((p) => !p.deletedAt && p.estadoAprobacion === 'pendiente').length +
    visitas.filter((v) => !v.deletedAt && v.estadoAprobacion === 'pendiente').length;

  const confirmPreview: ConfirmPreviewData | null =
    confirmKind === 'proyecto'
      ? {
          tipoEtiqueta: 'Expediente HCD',
          titulo: newProj.titulo,
          subtitulo: `${newProj.categoria} · ${newProj.estado}`,
          resumen: newProj.resumen,
          pdfNombre: newProj.archivoNombre || undefined,
          detalles: [
            { label: 'Expediente HCD', value: newProj.expediente || 'Automático' },
            { label: 'Autor', value: newProj.autor },
            { label: 'Localidad', value: newProj.localidad },
            { label: 'Cuenta', value: `@${user?.username}` },
          ],
        }
      : confirmKind === 'visita'
        ? {
            tipoEtiqueta: 'Recorrida / Novedad',
            titulo: newVisita.titulo,
            subtitulo: `${newVisita.localidad} · ${newVisita.fecha}`,
            resumen: newVisita.descripcion,
            imagenUrl: newVisita.foto,
            detalles: [
              { label: 'Localidad', value: newVisita.localidad },
              { label: 'Concejales', value: newVisita.concejales },
              { label: 'Temas', value: newVisita.temas },
              { label: 'Cuenta', value: `@${user?.username}` },
            ],
          }
        : null;

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#230552] flex items-center justify-center text-white text-sm">
        Verificando sesión institucional...
      </main>
    );
  }

  if (!user) {
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
            <h1 className="text-2xl font-extrabold text-[#1d1d1d]">Portal Institucional</h1>
            <p className="text-xs text-slate-600 mt-1">
              Acceso por cuenta: Administradores, Concejales y Consejeros Escolares
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6c4c99] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ej: admin, juan.aquino, ariel.vieyra..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#371859]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Contraseña
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
                  {loginError}
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-[#371859] hover:bg-[#230552] text-white font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Ingresar al Portal
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#371859] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a llabrown.com.ar</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isAdmin = user.role === 'admin';

  const navTabs: Array<{ id: AdminTabId; label: string; icon: React.ReactNode; adminOnly?: boolean }> = [
    { id: 'aprobaciones', label: `Aprobaciones (${pendingCount})`, icon: <ShieldCheck className="w-3.5 h-3.5" />, adminOnly: true },
    { id: 'reclamos', label: `Reclamos (${reclamos.length})`, icon: <MessageCircle className="w-3.5 h-3.5" />, adminOnly: true },
    { id: 'noticias', label: 'Noticias y Nación', icon: <Newspaper className="w-3.5 h-3.5" /> },
    { id: 'proyectos', label: 'Expedientes HCD', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'visitas', label: 'Recorridas', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'pines', label: 'Mapa Pines', icon: <MapPin className="w-3.5 h-3.5" />, adminOnly: true },
    { id: 'equipo', label: 'Equipo y Legisladores', icon: <Users className="w-3.5 h-3.5" />, adminOnly: true },
    { id: 'formularios', label: 'Formularios Propios', icon: <ClipboardList className="w-3.5 h-3.5" />, adminOnly: true },
    { id: 'correos', label: 'Correos Zoho', icon: <Mail className="w-3.5 h-3.5" />, adminOnly: true },
    { id: 'localidades', label: 'Localidades y Web', icon: <Settings className="w-3.5 h-3.5" />, adminOnly: true },
    { id: 'usuarios', label: 'Cuentas y Roles', icon: <Shield className="w-3.5 h-3.5" />, adminOnly: true },
  ];

  const visibleTabs = navTabs.filter((t) => !t.adminOnly || isAdmin);

  return (
    <main className="min-h-screen bg-[#120629] text-white pb-16">
      {/* Barra superior */}
      <header className="bg-[#371859] border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="relative w-36 h-10 overflow-hidden block">
              <Image
                src="/img/logo.png"
                alt="LLA Almirante Brown"
                fill
                className="object-contain object-[0%_40%] scale-[1.55] origin-left"
              />
            </Link>
            <div className="border-l border-white/20 pl-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white">{user.nombre}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    isAdmin ? 'bg-[#39b5e6] text-[#120629]' : 'bg-white/20 text-white'
                  }`}
                >
                  {isAdmin ? 'Administrador' : 'Equipo Concejal/Consejero'}
                </span>
              </div>
              <span className="text-[11px] text-white/75">
                @{user.username} · {user.cargo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white"
            >
              Ver sitio público
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-xs font-bold text-white inline-flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Aviso de permisos para cuentas de equipo */}
        {!isAdmin && (
          <div className="p-4 rounded-2xl bg-[#230552] border border-[#39b5e6]/40 text-xs text-slate-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#39b5e6] shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Modo Equipo de Concejal / Consejero Escolar:</strong> Podés cargar{' '}
              <strong>Noticias, Expedientes HCD y Recorridas</strong>. Todo envío pasa por una verificación obligatoria
              previa y queda guardado como <strong>Pendiente de Aprobación</strong> hasta que un Administrador lo
              apruebe. Las cuentas de equipo no tienen permiso para borrar contenidos.
            </div>
          </div>
        )}

        {feedbackBanner && (
          <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs flex items-center justify-between gap-4">
            <span>{feedbackBanner}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner('')}
              className="text-emerald-300 font-bold"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Navegación por pestañas */}
        <nav className="flex flex-wrap gap-2 pb-2 border-b border-white/10">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                activeTab === t.id
                  ? 'bg-white text-[#371859] shadow-sm'
                  : 'bg-white/10 text-white/85 hover:bg-white/20'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </nav>

        {/* TAB: APROBACIONES (SOLO ADMIN) */}
        {activeTab === 'aprobaciones' && isAdmin && (
          <AprobacionesTab
            noticias={noticias}
            proyectos={proyectos}
            visitas={visitas}
            onRefreshAll={() => refreshData(user)}
          />
        )}

        {/* TAB: RECLAMOS VECINALES (SOLO ADMIN) */}
        {activeTab === 'reclamos' && isAdmin && (
          <div className="space-y-4">
            <h2 className="text-lg font-extrabold text-white">
              Auditoría de Reclamos Vecinales ({reclamos.length})
            </h2>
            {reclamos.length === 0 ? (
              <div className="glass-panel rounded-2xl p-8 text-center text-xs text-slate-300">
                Todavía no hay reclamos cargados por vecinos.
              </div>
            ) : (
              reclamos.map((r) => (
                <div
                  key={r.id}
                  className="glass-panel rounded-2xl p-5 border border-white/15 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <span className="font-mono font-bold text-[#39b5e6] bg-white/10 px-2 py-0.5 rounded">
                        {r.codigoSeguimiento}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/30 text-white font-bold">
                        {r.estado}
                      </span>
                      <span className="text-slate-400">{r.fecha}</span>
                    </div>
                    <h3 className="text-sm font-extrabold text-white">
                      {r.tipoReclamo} — {r.calle} {r.altura || ''} ({r.barrio ? `${r.barrio}, ` : ''}{r.localidad})
                    </h3>
                    <p className="text-xs text-slate-300">{r.descripcion}</p>
                    <p className="text-[11px] text-slate-400">
                      Vecino: <strong className="text-white">{r.nombreVecino}</strong> · Tel: {r.telefonoVecino}
                      {r.dniVecino ? ` · DNI: ${r.dniVecino}` : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={editingMunicipalNumbers[r.id] || ''}
                      onChange={(e) =>
                        setEditingMunicipalNumbers({ ...editingMunicipalNumbers, [r.id]: e.target.value })
                      }
                      placeholder="N° reclamo municipal..."
                      className="px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white w-44"
                    />
                    <button
                      type="button"
                      disabled={savingReclamoId === r.id}
                      onClick={() => handleSaveNumeroMunicipal(r.id)}
                      className="px-4 py-2 rounded-lg bg-white text-[#371859] font-bold text-xs"
                    >
                      Guardar N°
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB: NOTICIAS Y NACIÓN (ADMIN + EDITOR) */}
        {activeTab === 'noticias' && (
          <NoticiasTab
            user={user}
            noticias={noticias}
            localidades={localidades.filter((l) => l.activo !== false)}
            onRefresh={() => refreshData(user)}
          />
        )}

        {/* TAB: EXPEDIENTES HCD (ADMIN + EDITOR CON MODAL ANTI-ERRORES) */}
        {activeTab === 'proyectos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newProj.titulo.trim() || !newProj.resumen.trim()) return;
                setConfirmKind('proyecto');
              }}
              className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-white/15 space-y-4"
            >
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#39b5e6]" />
                <span>Cargar Expediente / Proyecto HCD</span>
              </h2>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Título del proyecto *</label>
                <input
                  type="text"
                  required
                  value={newProj.titulo}
                  onChange={(e) => setNewProj({ ...newProj, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">N° Expediente HCD</label>
                  <input
                    type="text"
                    value={newProj.expediente}
                    onChange={(e) => setNewProj({ ...newProj, expediente: e.target.value })}
                    placeholder="Ej: HCD-EXP-0412/2026"
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Categoría</label>
                  <select
                    value={newProj.categoria}
                    onChange={(e) =>
                      setNewProj({ ...newProj, categoria: e.target.value as ProyectoHCD['categoria'] })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                  >
                    <option value="Baja de Tasas">Baja de Tasas</option>
                    <option value="Seguridad">Seguridad</option>
                    <option value="Desregulación">Desregulación</option>
                    <option value="Infraestructura">Infraestructura</option>
                    <option value="Educación">Educación</option>
                    <option value="Salud">Salud</option>
                    <option value="Transparencia">Transparencia</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Autor</label>
                  <input
                    type="text"
                    value={newProj.autor}
                    onChange={(e) => setNewProj({ ...newProj, autor: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Localidad</label>
                  <select
                    value={newProj.localidad}
                    onChange={(e) => setNewProj({ ...newProj, localidad: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                  >
                    <option value="Almirante Brown">Todo Almirante Brown</option>
                    {localidades
                      .filter((l) => l.activo !== false)
                      .map((l) => (
                        <option key={l.id} value={l.nombre}>
                          {l.nombre}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Resumen del proyecto *</label>
                <textarea
                  rows={4}
                  required
                  value={newProj.resumen}
                  onChange={(e) => setNewProj({ ...newProj, resumen: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-300 truncate">
                  {newProj.archivoNombre ? `PDF: ${newProj.archivoNombre}` : 'Adjuntar PDF del expediente (opcional)'}
                </span>
                <label className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingPdf ? 'Subiendo...' : 'Subir PDF'}</span>
                  <input type="file" accept="application/pdf" onChange={handlePdfUpload} className="hidden" />
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-extrabold text-xs uppercase tracking-wider"
              >
                Revisar vista previa y enviar
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-sm font-bold text-white/90">
                Expedientes cargados ({proyectos.filter((p) => !p.deletedAt).length})
              </h3>
              {proyectos
                .filter((p) => !p.deletedAt)
                .map((p) => (
                  <div
                    key={p.id}
                    className="glass-panel rounded-xl p-4 border border-white/15 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-white/15 text-white">{p.categoria}</span>
                        {p.estadoAprobacion === 'pendiente' ? (
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pendiente de aprobación
                          </span>
                        ) : p.estadoAprobacion === 'rechazado' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" /> Denegado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Publicado
                          </span>
                        )}
                        {p.expediente && (
                          <a
                            href={p.archivoPdf || getDigestoSearchUrl(p.expediente, p.titulo)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#39b5e6] font-mono inline-flex items-center gap-1 hover:underline"
                          >
                            {p.expediente} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">{p.titulo}</h4>
                      <p className="text-xs text-slate-300 line-clamp-2">{p.resumen}</p>
                      <p className="text-[11px] text-slate-400">
                        Autor: {p.autor} · {p.localidad} · @{p.creadoPor || 'admin'}
                      </p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(p.id)}
                        className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 shrink-0"
                        title="Eliminar de la web (mantener respaldo)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB: RECORRIDAS / VISITAS (ADMIN + EDITOR CON MODAL ANTI-ERRORES) */}
        {activeTab === 'visitas' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newVisita.titulo.trim() || !newVisita.descripcion.trim()) return;
                setConfirmKind('visita');
              }}
              className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-white/15 space-y-4"
            >
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-[#39b5e6]" />
                <span>Cargar Recorrida / Novedad Barrial</span>
              </h2>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={newVisita.titulo}
                  onChange={(e) => setNewVisita({ ...newVisita, titulo: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Localidad</label>
                  <select
                    value={newVisita.localidad}
                    onChange={(e) => setNewVisita({ ...newVisita, localidad: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                  >
                    {localidades
                      .filter((l) => l.activo !== false)
                      .map((l) => (
                        <option key={l.id} value={l.nombre}>
                          {l.nombre}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Fecha</label>
                  <input
                    type="text"
                    value={newVisita.fecha}
                    onChange={(e) => setNewVisita({ ...newVisita, fecha: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Descripción *</label>
                <textarea
                  rows={4}
                  required
                  value={newVisita.descripcion}
                  onChange={(e) => setNewVisita({ ...newVisita, descripcion: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Concejales / Equipo</label>
                  <input
                    type="text"
                    value={newVisita.concejales}
                    onChange={(e) => setNewVisita({ ...newVisita, concejales: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Temas (separados por coma)</label>
                  <input
                    type="text"
                    value={newVisita.temas}
                    onChange={(e) => setNewVisita({ ...newVisita, temas: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/25 border border-white/10 flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-300 truncate">Foto: {newVisita.foto}</span>
                <label className="px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingVisitaFoto ? 'Subiendo...' : 'Subir foto'}</span>
                  <input type="file" accept="image/*" onChange={handleVisitaPhotoUpload} className="hidden" />
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-extrabold text-xs uppercase tracking-wider"
              >
                Revisar vista previa y enviar
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              <h3 className="text-sm font-bold text-white/90">
                Recorridas registradas ({visitas.filter((v) => !v.deletedAt).length})
              </h3>
              {visitas
                .filter((v) => !v.deletedAt)
                .map((v) => (
                  <div
                    key={v.id}
                    className="glass-panel rounded-xl p-4 border border-white/15 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                        <span className="px-2 py-0.5 rounded bg-white/15 text-white">{v.localidad}</span>
                        {v.estadoAprobacion === 'pendiente' ? (
                          <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300">Pendiente de aprobación</span>
                        ) : v.estadoAprobacion === 'rechazado' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">Denegada</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Publicada</span>
                        )}
                        <span className="text-slate-400">
                          {v.fecha} · @{v.creadoPor || 'admin'}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{v.titulo}</h4>
                      <p className="text-xs text-slate-300 line-clamp-2">{v.descripcion}</p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVisita(v.id)}
                        className="p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 shrink-0"
                        title="Eliminar de la web (mantener respaldo)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB: PINES DEL MAPA (ADMIN) */}
        {activeTab === 'pines' && isAdmin && <AdminPinPicker />}

        {/* TAB: EQUIPO Y LEGISLADORES PROVINCIALES / NACIONALES (ADMIN) */}
        {activeTab === 'equipo' && isAdmin && (
          <EquipoAdminTab miembros={equipo} onRefresh={() => refreshData(user)} />
        )}

        {/* TAB: FORMULARIOS PROPIOS (ADMIN) */}
        {activeTab === 'formularios' && isAdmin && (
          <FormulariosTab formularios={formularios} onRefresh={() => refreshData(user)} />
        )}

        {/* TAB: CORREOS ZOHO (ADMIN) */}
        {activeTab === 'correos' && isAdmin && (
          <CorreosZohoTab
            config={config}
            formularios={formularios}
            onRefreshConfig={() => refreshData(user)}
          />
        )}

        {/* TAB: LOCALIDADES, CONFIGURACIÓN Y RESPALDOS BD (ADMIN) */}
        {activeTab === 'localidades' && isAdmin && (
          <LocalidadesConfigTab
            localidades={localidades}
            config={config}
            onRefresh={() => refreshData(user)}
          />
        )}

        {/* TAB: USUARIOS Y ROLES (ADMIN) */}
        {activeTab === 'usuarios' && isAdmin && (
          <UsuariosTab usuarios={usuarios} onRefresh={() => refreshData(user)} />
        )}
      </div>

      {/* Modal obligatorio de confirmación previa al envío */}
      <ConfirmPublishModal
        open={confirmKind !== null}
        role={user.role}
        preview={confirmPreview}
        submitting={submittingConfirm}
        onCancel={() => setConfirmKind(null)}
        onConfirm={handleConfirmedCreate}
      />
    </main>
  );
}
