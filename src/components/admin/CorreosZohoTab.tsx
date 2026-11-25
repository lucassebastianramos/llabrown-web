'use client';

import React, { useEffect, useState } from 'react';
import { CorreoEnviado, FormularioDinamico, SiteConfig } from '@/types';
import { CheckCircle2, Mail, Send, Server, Users, XCircle } from 'lucide-react';

interface CorreosZohoTabProps {
  config: SiteConfig;
  formularios: FormularioDinamico[];
  onRefreshConfig: () => void;
}

export default function CorreosZohoTab({
  config,
  formularios,
  onRefreshConfig,
}: CorreosZohoTabProps) {
  const [remitente, setRemitente] = useState(config.emailGeneral || 'lalibertadavanza@llabrown.com.ar');
  const [destinatarios, setDestinatarios] = useState('');
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [sending, setSending] = useState(false);
  const [sendFeedback, setSendFeedback] = useState<string>('');

  const [smtpHost, setSmtpHost] = useState(config.zohoSmtpHost || 'smtp.zoho.com');
  const [smtpPort, setSmtpPort] = useState(config.zohoSmtpPort || 465);
  const [smtpUser, setSmtpUser] = useState(config.zohoSmtpUser || 'lalibertadavanza@llabrown.com.ar');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpStatus, setSmtpStatus] = useState('');

  const [historial, setHistorial] = useState<CorreoEnviado[]>([]);

  const loadHistorial = () => {
    fetch('/api/correos')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setHistorial(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadHistorial();
  }, []);

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmtpStatus('Guardando credenciales Zoho...');
    const res = await fetch('/api/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zohoSmtpHost: smtpHost,
        zohoSmtpPort: Number(smtpPort) || 465,
        zohoSmtpUser: smtpUser,
        zohoSmtpPass: smtpPass || undefined,
      }),
    });
    if (res.ok) {
      setSmtpPass('');
      setSmtpStatus('Configuración SMTP Zoho guardada. Probá la conexión con el botón "Probar Zoho".');
      onRefreshConfig();
    } else {
      setSmtpStatus('Error al guardar la configuración SMTP.');
    }
  };

  const handleTestSmtp = async () => {
    setSmtpStatus('Probando conexión SMTP con Zoho Mail...');
    const res = await fetch('/api/correos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'test' }),
    });
    const data = await res.json();
    setSmtpStatus(data.message || (res.ok ? 'Conexión exitosa.' : 'Error de conexión.'));
  };

  const handleLoadFromForm = async (slug: string) => {
    if (!slug) return;
    const res = await fetch(`/api/formularios/${slug}/respuestas`);
    if (!res.ok) return;
    const rows = await res.json();
    const emails = new Set<string>();
    if (Array.isArray(rows)) {
      rows.forEach((r: any) => {
        Object.values(r.datos || {}).forEach((val) => {
          if (typeof val === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
            emails.add(val.trim().toLowerCase());
          }
        });
      });
    }
    if (emails.size === 0) {
      setSendFeedback('Ese formulario todavía no tiene respuestas con direcciones de email.');
    } else {
      setDestinatarios(Array.from(emails).join(', '));
      setSendFeedback(`Se cargaron ${emails.size} destinatarios desde /f/${slug}.`);
    }
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendFeedback('');
    try {
      const res = await fetch('/api/correos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remitente, destinatarios, asunto, cuerpo }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.estado === 'enviado') {
          setSendFeedback(`Correo enviado exitosamente vía Zoho Mail a ${data.destinatarios.length} destinatario(s).`);
          setAsunto('');
          setCuerpo('');
        } else {
          setSendFeedback(data.errorDetalle || 'Correo registrado en historial (revisá SMTP Zoho).');
        }
        loadHistorial();
      } else {
        setSendFeedback(data.error || 'No se pudo enviar el correo.');
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Redactor y envío masivo / individual Zoho Mail */}
        <form
          onSubmit={handleSendMail}
          className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-purple-500/30 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white">
              <Mail className="w-5 h-5 text-[#39b5e6]" />
              <h2 className="text-base font-extrabold">Enviar Correo Institucional (Zoho Mail)</h2>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                config.zohoSmtpConfigured
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-sky-500/20 text-sky-300'
              }`}
            >
              {config.zohoSmtpConfigured ? 'SMTP Zoho Conectado' : 'Falta clave SMTP Zoho'}
            </span>
          </div>

          {sendFeedback && (
            <div className="p-3 rounded-xl bg-white/10 border border-white/15 text-xs text-white">
              {sendFeedback}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Casilla remitente</label>
              <select
                value={remitente}
                onChange={(e) => setRemitente(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
              >
                <option value={config.emailGeneral}>{config.emailGeneral} (General)</option>
                <option value={config.emailFiscalizacion}>{config.emailFiscalizacion} (Fiscalización)</option>
                <option value={config.emailPrensa}>{config.emailPrensa} (Prensa)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Importar destinatarios desde un Formulario
              </label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#39b5e6] shrink-0" />
                <select
                  defaultValue=""
                  onChange={(e) => handleLoadFromForm(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
                >
                  <option value="">Elegir lista de inscriptos...</option>
                  {formularios.map((f) => (
                    <option key={f.id} value={f.slug}>
                      {f.titulo} ({f.respuestasCount ?? 0})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Destinatarios * (separados por coma o salto de línea; múltiples van con copia oculta BCC)
            </label>
            <textarea
              rows={2}
              required
              value={destinatarios}
              onChange={(e) => setDestinatarios(e.target.value)}
              placeholder="vecino@correo.com, prensa@medio.com"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Asunto *</label>
            <input
              type="text"
              required
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej: Convocatoria de Fiscales — Almirante Brown"
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Mensaje *</label>
            <textarea
              rows={6}
              required
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              placeholder="Redactá el comunicado institucional (se envía con encabezado violeta oficial de LLA Almirante Brown)..."
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 rounded-lg bg-white hover:bg-slate-100 text-[#371859] font-extrabold text-xs inline-flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Enviando vía Zoho Mail...' : 'Enviar correo ahora'}</span>
          </button>
        </form>

        {/* Configuración SMTP Zoho Mail */}
        <form
          onSubmit={handleSaveSmtp}
          className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-white/15 space-y-4"
        >
          <div className="flex items-center gap-2 text-white">
            <Server className="w-5 h-5 text-[#39b5e6]" />
            <h3 className="text-sm font-extrabold">Conexión SMTP Zoho Mail</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            En Zoho Mail → <strong>Mi Cuenta → Seguridad → Contraseñas de aplicación</strong> generá una clave para <code>lalibertadavanza@llabrown.com.ar</code> y pegala aquí (queda cifrada/oculta en la base de datos del servidor).
          </p>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Servidor SMTP</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Puerto</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">Usuario Zoho</label>
            <input
              type="email"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              Contraseña de Aplicación Zoho
            </label>
            <input
              type="password"
              value={smtpPass}
              onChange={(e) => setSmtpPass(e.target.value)}
              placeholder={config.zohoSmtpConfigured ? '•••••••• (guardada — dejar vacío para mantener)' : 'Pegar App Password de Zoho'}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/15 text-xs text-white"
            />
          </div>

          {smtpStatus && <p className="text-xs text-[#39b5e6]">{smtpStatus}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 rounded-lg bg-white text-[#371859] font-bold text-xs"
            >
              Guardar SMTP
            </button>
            <button
              type="button"
              onClick={handleTestSmtp}
              className="px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white font-bold text-xs"
            >
              Probar Zoho
            </button>
          </div>
        </form>
      </div>

      {/* Historial en PostgreSQL */}
      <div className="glass-panel rounded-2xl p-6 border border-white/15 space-y-3">
        <h3 className="text-sm font-extrabold text-white">
          Historial de correos registrados en BD ({historial.length})
        </h3>
        <div className="divide-y divide-white/10 text-xs">
          {historial.length === 0 ? (
            <p className="text-slate-400 py-3">Aún no se enviaron correos desde la plataforma.</p>
          ) : (
            historial.map((h) => (
              <div key={h.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    {h.estado === 'enviado' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-sky-400" />
                    )}
                    <strong className="text-white">{h.asunto}</strong>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">
                      {h.estado}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    De: {h.remitente} · Para: {h.destinatarios.join(', ')}
                  </p>
                  {h.errorDetalle && <p className="text-[11px] text-rose-300 mt-0.5">{h.errorDetalle}</p>}
                </div>
                <span className="text-[11px] text-slate-400 shrink-0">
                  @{h.enviadoPor} · {new Date(h.createdAt).toLocaleString('es-AR')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
