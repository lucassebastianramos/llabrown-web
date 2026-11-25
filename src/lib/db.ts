import { Pool } from 'pg';
import {
  ApprovalStatus,
  AuditLogEntry,
  CorreoEnviado,
  FormularioDinamico,
  FormularioRespuesta,
  LocalidadInfo,
  MiembroEquipo,
  NoticiaItem,
  PinTerritorial,
  ProyectoHCD,
  ReclamoVecinal,
  SessionUser,
  SiteConfig,
  UsuarioSistema,
  VisitaTerritorial,
} from '@/types';
import {
  CONCEJALES,
  CONSEJEROS,
  LOCALIDADES,
  PINES_INICIALES,
  PROYECTOS_INICIALES,
  VISITAS_INICIALES,
} from '@/data/mockData';
import {
  DEFAULT_SITE_CONFIG,
  DEFAULT_USERS,
  FORMULARIOS_INICIALES,
  LEGISLADORES_INICIALES,
  NOTICIAS_INICIALES,
} from '@/data/seedDefaults';
import {
  hashPassword,
  verifyMasterAdminFallback,
  verifyPasswordHash,
} from '@/lib/adminAuth';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://lla_user:lla_password@localhost:5432/llabrown';

declare global {
  var _pgPool: Pool | undefined;
}

let pool: Pool;
if (!global._pgPool) {
  global._pgPool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}
pool = global._pgPool;

export default pool;

let isDbInitialized = false;

// --- In-memory fallback stores (when PostgreSQL is offline during build/local dev) ---
let fallbackUsers: Array<UsuarioSistema & { passwordHash: string }> = DEFAULT_USERS.map((u) => ({
  id: u.id,
  username: u.username,
  nombre: u.nombre,
  role: u.role,
  cargo: u.cargo,
  email: u.email,
  activo: true,
  passwordHash: hashPassword(u.initialPassword),
  createdAt: new Date().toISOString(),
}));
let fallbackProyectos: ProyectoHCD[] = PROYECTOS_INICIALES.map((p) => ({
  ...p,
  estadoAprobacion: 'aprobado',
  creadoPor: 'admin',
  deletedAt: null,
}));
let fallbackVisitas: VisitaTerritorial[] = VISITAS_INICIALES.map((v) => ({
  ...v,
  estadoAprobacion: 'aprobado',
  creadoPor: 'admin',
  deletedAt: null,
}));
let fallbackNoticias: NoticiaItem[] = [...NOTICIAS_INICIALES];
let fallbackEquipo: MiembroEquipo[] = [
  ...CONCEJALES.map((m, idx) => ({ ...m, orden: idx + 1, activo: true })),
  ...CONSEJEROS.map((m, idx) => ({ ...m, orden: idx + 1, activo: true })),
  ...LEGISLADORES_INICIALES,
];
let fallbackLocalidades: LocalidadInfo[] = LOCALIDADES.map((l, idx) => ({
  ...l,
  activo: true,
  orden: idx + 1,
}));
let fallbackFormularios: FormularioDinamico[] = [...FORMULARIOS_INICIALES];
let fallbackRespuestas: FormularioRespuesta[] = [];
let fallbackSiteConfig: SiteConfig = { ...DEFAULT_SITE_CONFIG };
let fallbackSmtpPass = process.env.ZOHO_SMTP_PASS || '';
let fallbackCorreos: CorreoEnviado[] = [];
let fallbackAuditLogs: AuditLogEntry[] = [];
let fallbackReclamos: ReclamoVecinal[] = [];
let fallbackPines: PinTerritorial[] = [...PINES_INICIALES];

export async function initDatabase() {
  if (isDbInitialized) return;

  try {
    const client = await pool.connect();
    try {
      // 1. Tabla proyectos + columnas de moderación y borrado lógico
      await client.query(`
        CREATE TABLE IF NOT EXISTS proyectos (
          id VARCHAR(64) PRIMARY KEY,
          titulo TEXT NOT NULL,
          expediente VARCHAR(64),
          archivo_pdf TEXT,
          archivo_nombre TEXT,
          fecha VARCHAR(32) NOT NULL,
          autor VARCHAR(128) NOT NULL,
          localidad VARCHAR(128) NOT NULL,
          categoria VARCHAR(64) NOT NULL,
          estado VARCHAR(64) NOT NULL,
          resumen TEXT NOT NULL,
          destacado BOOLEAN DEFAULT false,
          estado_aprobacion VARCHAR(24) NOT NULL DEFAULT 'aprobado',
          creado_por VARCHAR(128) DEFAULT 'admin',
          revisado_por VARCHAR(128),
          revisado_at TIMESTAMP WITH TIME ZONE,
          motivo_rechazo TEXT,
          deleted_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS archivo_pdf TEXT;
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS archivo_nombre TEXT;
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS estado_aprobacion VARCHAR(24) NOT NULL DEFAULT 'aprobado';
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS creado_por VARCHAR(128) DEFAULT 'admin';
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS revisado_por VARCHAR(128);
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS revisado_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
      `);

      // 2. Tabla visitas + columnas de moderación y borrado lógico
      await client.query(`
        CREATE TABLE IF NOT EXISTS visitas (
          id VARCHAR(64) PRIMARY KEY,
          titulo TEXT NOT NULL,
          localidad VARCHAR(128) NOT NULL,
          circuito VARCHAR(32),
          fecha VARCHAR(32) NOT NULL,
          descripcion TEXT NOT NULL,
          fotos TEXT[] NOT NULL DEFAULT '{}',
          concejales TEXT[] NOT NULL DEFAULT '{}',
          temas_tratados TEXT[] NOT NULL DEFAULT '{}',
          estado_aprobacion VARCHAR(24) NOT NULL DEFAULT 'aprobado',
          creado_por VARCHAR(128) DEFAULT 'admin',
          revisado_por VARCHAR(128),
          revisado_at TIMESTAMP WITH TIME ZONE,
          motivo_rechazo TEXT,
          deleted_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE visitas ADD COLUMN IF NOT EXISTS estado_aprobacion VARCHAR(24) NOT NULL DEFAULT 'aprobado';
        ALTER TABLE visitas ADD COLUMN IF NOT EXISTS creado_por VARCHAR(128) DEFAULT 'admin';
        ALTER TABLE visitas ADD COLUMN IF NOT EXISTS revisado_por VARCHAR(128);
        ALTER TABLE visitas ADD COLUMN IF NOT EXISTS revisado_at TIMESTAMP WITH TIME ZONE;
        ALTER TABLE visitas ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
        ALTER TABLE visitas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
      `);

      // 3. Tabla pines_territoriales
      await client.query(`
        CREATE TABLE IF NOT EXISTS pines_territoriales (
          id VARCHAR(64) PRIMARY KEY,
          titulo TEXT NOT NULL,
          calle TEXT NOT NULL,
          localidad VARCHAR(128) NOT NULL,
          barrio VARCHAR(128),
          lat DOUBLE PRECISION NOT NULL,
          lng DOUBLE PRECISION NOT NULL,
          categoria VARCHAR(64) NOT NULL,
          estado VARCHAR(64) NOT NULL,
          descripcion TEXT NOT NULL,
          concejal VARCHAR(128) NOT NULL,
          fotos TEXT[] NOT NULL DEFAULT '{}',
          pdf_url TEXT,
          pdf_nombre TEXT,
          fecha VARCHAR(32) NOT NULL,
          apoyos_vecinales INT DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE pines_territoriales ADD COLUMN IF NOT EXISTS barrio VARCHAR(128);
      `);

      // 4. Tabla reclamos_vecinales
      await client.query(`
        CREATE TABLE IF NOT EXISTS reclamos_vecinales (
          id VARCHAR(64) PRIMARY KEY,
          codigo_seguimiento VARCHAR(64) NOT NULL UNIQUE,
          nombre_vecino VARCHAR(128) NOT NULL,
          apellido_vecino VARCHAR(128),
          dni_vecino VARCHAR(32),
          telefono_vecino VARCHAR(64) NOT NULL,
          localidad VARCHAR(128) NOT NULL,
          barrio VARCHAR(128),
          calle TEXT NOT NULL,
          altura VARCHAR(32),
          entre_calles TEXT,
          tipo_reclamo VARCHAR(128) NOT NULL,
          subtipo_reclamo VARCHAR(128),
          descripcion TEXT NOT NULL,
          norma_digesto TEXT,
          estado VARCHAR(64) NOT NULL DEFAULT 'Registrado en LLA',
          numero_reclamo_municipal VARCHAR(64),
          patrocinado_por VARCHAR(128) NOT NULL DEFAULT 'Juan Pedro Aquino · Jefe de Bloque Concejales LLA',
          fecha VARCHAR(32) NOT NULL,
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 5. Tabla usuarios (RBAC: admin + cuentas individuales de concejales y consejeros)
      await client.query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id VARCHAR(64) PRIMARY KEY,
          username VARCHAR(64) NOT NULL UNIQUE,
          nombre VARCHAR(128) NOT NULL,
          role VARCHAR(24) NOT NULL DEFAULT 'editor',
          cargo VARCHAR(128) NOT NULL,
          email VARCHAR(128),
          password_hash TEXT NOT NULL,
          activo BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 6. Tabla noticias (Nación, Provincia, Distrito, Novedades + flujo de aprobación)
      await client.query(`
        CREATE TABLE IF NOT EXISTS noticias (
          id VARCHAR(64) PRIMARY KEY,
          titulo TEXT NOT NULL,
          bajada TEXT NOT NULL,
          cuerpo TEXT NOT NULL,
          ambito VARCHAR(32) NOT NULL DEFAULT 'Distrito',
          localidad VARCHAR(128),
          imagen_url TEXT,
          fuente_url TEXT,
          autor VARCHAR(128) NOT NULL,
          fecha VARCHAR(32) NOT NULL,
          destacada BOOLEAN DEFAULT false,
          estado_aprobacion VARCHAR(24) NOT NULL DEFAULT 'pendiente',
          creado_por VARCHAR(128) DEFAULT 'admin',
          revisado_por VARCHAR(128),
          revisado_at TIMESTAMP WITH TIME ZONE,
          motivo_rechazo TEXT,
          deleted_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 7. Tabla miembros_equipo (Concejales, Consejeros, Legisladores Provinciales y Nacionales)
      await client.query(`
        CREATE TABLE IF NOT EXISTS miembros_equipo (
          id VARCHAR(64) PRIMARY KEY,
          nombre VARCHAR(128) NOT NULL,
          rol VARCHAR(160) NOT NULL,
          localidad VARCHAR(128) NOT NULL,
          foto TEXT NOT NULL,
          estilo TEXT,
          tipo VARCHAR(32) NOT NULL,
          bio TEXT,
          instagram TEXT,
          twitter TEXT,
          orden INT NOT NULL DEFAULT 10,
          activo BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 8. Tabla localidades dinámicas
      await client.query(`
        CREATE TABLE IF NOT EXISTS localidades (
          id VARCHAR(64) PRIMARY KEY,
          nombre VARCHAR(128) NOT NULL UNIQUE,
          circuito VARCHAR(32) NOT NULL DEFAULT '0019',
          wa TEXT NOT NULL DEFAULT 'https://wa.me/5491131596936',
          descripcion TEXT NOT NULL DEFAULT '',
          lat DOUBLE PRECISION NOT NULL DEFAULT -34.81,
          lng DOUBLE PRECISION NOT NULL DEFAULT -58.38,
          hitos TEXT[] NOT NULL DEFAULT '{}',
          referente_nombre VARCHAR(128) NOT NULL DEFAULT 'Equipo Territorial LLA',
          destacado TEXT NOT NULL DEFAULT '',
          orden INT NOT NULL DEFAULT 10,
          activo BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 9. Tablas de Formularios Propios (reemplazo nativo de Google Forms)
      await client.query(`
        CREATE TABLE IF NOT EXISTS formularios (
          id VARCHAR(64) PRIMARY KEY,
          slug VARCHAR(96) NOT NULL UNIQUE,
          titulo TEXT NOT NULL,
          descripcion TEXT NOT NULL DEFAULT '',
          categoria VARCHAR(64) NOT NULL DEFAULT 'General',
          email_notificacion VARCHAR(128),
          campos_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          activo BOOLEAN NOT NULL DEFAULT true,
          creado_por VARCHAR(128) DEFAULT 'admin',
          deleted_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS formulario_respuestas (
          id VARCHAR(64) PRIMARY KEY,
          formulario_id VARCHAR(64) NOT NULL,
          formulario_slug VARCHAR(96) NOT NULL,
          datos_json JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_respuestas_slug ON formulario_respuestas(formulario_slug);
      `);

      // 10. Tabla site_config (dinamización de página + credenciales SMTP Zoho por casilla)
      await client.query(`
        CREATE TABLE IF NOT EXISTS site_config (
          id VARCHAR(32) PRIMARY KEY,
          config_json JSONB NOT NULL,
          zoho_smtp_pass TEXT,
          zoho_accounts_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE site_config ADD COLUMN IF NOT EXISTS zoho_accounts_json JSONB NOT NULL DEFAULT '{}'::jsonb;
      `);

      // 11. Tabla correos_enviados (historial Zoho Mail)
      await client.query(`
        CREATE TABLE IF NOT EXISTS correos_enviados (
          id VARCHAR(64) PRIMARY KEY,
          remitente VARCHAR(128) NOT NULL,
          destinatarios TEXT[] NOT NULL,
          asunto TEXT NOT NULL,
          cuerpo TEXT NOT NULL,
          estado VARCHAR(24) NOT NULL,
          error_detalle TEXT,
          enviado_por VARCHAR(128) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 12. Tabla audit_logs (respaldo histórico permanente en BD)
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id VARCHAR(64) PRIMARY KEY,
          entidad VARCHAR(64) NOT NULL,
          entidad_id VARCHAR(64) NOT NULL,
          accion VARCHAR(48) NOT NULL,
          usuario VARCHAR(128) NOT NULL,
          rol VARCHAR(24) NOT NULL,
          detalle TEXT,
          respaldo_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // --- Seeds idempotentes ---
      const usrCount = await client.query('SELECT COUNT(*) FROM usuarios');
      if (parseInt(usrCount.rows[0].count, 10) === 0) {
        for (const u of DEFAULT_USERS) {
          await client.query(
            `INSERT INTO usuarios (id, username, nombre, role, cargo, email, password_hash, activo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true)
             ON CONFLICT (username) DO NOTHING`,
            [u.id, u.username, u.nombre, u.role, u.cargo, u.email, hashPassword(u.initialPassword)]
          );
        }
      }

      const projsCount = await client.query('SELECT COUNT(*) FROM proyectos');
      if (parseInt(projsCount.rows[0].count, 10) === 0) {
        for (const p of PROYECTOS_INICIALES) {
          await client.query(
            `INSERT INTO proyectos (id, titulo, expediente, archivo_pdf, archivo_nombre, fecha, autor, localidad, categoria, estado, resumen, destacado, estado_aprobacion, creado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'aprobado', 'admin')
             ON CONFLICT (id) DO NOTHING`,
            [p.id, p.titulo, p.expediente || '', p.archivoPdf || '', p.archivoNombre || '', p.fecha, p.autor, p.localidad, p.categoria, p.estado, p.resumen, !!p.destacado]
          );
        }
      }

      const visitasCount = await client.query('SELECT COUNT(*) FROM visitas');
      if (parseInt(visitasCount.rows[0].count, 10) === 0) {
        for (const v of VISITAS_INICIALES) {
          await client.query(
            `INSERT INTO visitas (id, titulo, localidad, circuito, fecha, descripcion, fotos, concejales, temas_tratados, estado_aprobacion, creado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'aprobado', 'admin')
             ON CONFLICT (id) DO NOTHING`,
            [v.id, v.titulo, v.localidad, v.circuito || '', v.fecha, v.descripcion, v.fotos, v.concejales, v.temasTratados]
          );
        }
      }

      const pinesCount = await client.query('SELECT COUNT(*) FROM pines_territoriales');
      if (parseInt(pinesCount.rows[0].count, 10) === 0) {
        for (const pin of PINES_INICIALES) {
          await client.query(
            `INSERT INTO pines_territoriales (id, titulo, calle, localidad, barrio, lat, lng, categoria, estado, descripcion, concejal, fotos, pdf_url, pdf_nombre, fecha, apoyos_vecinales)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
             ON CONFLICT (id) DO NOTHING`,
            [pin.id, pin.titulo, pin.calle, pin.localidad, pin.barrio || null, pin.lat, pin.lng, pin.categoria, pin.estado, pin.descripcion, pin.concejal, pin.fotos, pin.pdfUrl || null, pin.pdfNombre || null, pin.fecha, pin.apoyosVecinales || 0]
          );
        }
      }

      const noticiasCount = await client.query('SELECT COUNT(*) FROM noticias');
      if (parseInt(noticiasCount.rows[0].count, 10) === 0) {
        for (const n of NOTICIAS_INICIALES) {
          await client.query(
            `INSERT INTO noticias (id, titulo, bajada, cuerpo, ambito, localidad, imagen_url, fuente_url, autor, fecha, destacada, estado_aprobacion, creado_por, revisado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
             ON CONFLICT (id) DO NOTHING`,
            [n.id, n.titulo, n.bajada, n.cuerpo, n.ambito, n.localidad || null, n.imagenUrl || null, n.fuenteUrl || null, n.autor, n.fecha, !!n.destacada, n.estadoAprobacion, n.creadoPor || 'admin', n.revisadoPor || 'admin']
          );
        }
      }

      const equipoCount = await client.query('SELECT COUNT(*) FROM miembros_equipo');
      if (parseInt(equipoCount.rows[0].count, 10) === 0) {
        const allMembers: MiembroEquipo[] = [
          ...CONCEJALES.map((m, idx) => ({ ...m, orden: idx + 1, activo: true })),
          ...CONSEJEROS.map((m, idx) => ({ ...m, orden: idx + 1, activo: true })),
          ...LEGISLADORES_INICIALES,
        ];
        for (const m of allMembers) {
          await client.query(
            `INSERT INTO miembros_equipo (id, nombre, rol, localidad, foto, estilo, tipo, bio, instagram, twitter, orden, activo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
             ON CONFLICT (id) DO NOTHING`,
            [m.id, m.nombre, m.rol, m.localidad, m.foto, m.estilo || null, m.tipo, m.bio || null, m.redes?.instagram || null, m.redes?.twitter || null, m.orden || 10]
          );
        }
      }

      const locCount = await client.query('SELECT COUNT(*) FROM localidades');
      if (parseInt(locCount.rows[0].count, 10) === 0) {
        for (let i = 0; i < LOCALIDADES.length; i++) {
          const l = LOCALIDADES[i];
          await client.query(
            `INSERT INTO localidades (id, nombre, circuito, wa, descripcion, lat, lng, hitos, referente_nombre, destacado, orden, activo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
             ON CONFLICT (id) DO NOTHING`,
            [l.id, l.nombre, l.circuito, l.wa, l.descripcion, l.coordenadas[0], l.coordenadas[1], l.hitos, l.referenteNombre, l.destacado, i + 1]
          );
        }
      }

      const formCount = await client.query('SELECT COUNT(*) FROM formularios');
      if (parseInt(formCount.rows[0].count, 10) === 0) {
        for (const f of FORMULARIOS_INICIALES) {
          await client.query(
            `INSERT INTO formularios (id, slug, titulo, descripcion, categoria, email_notificacion, campos_json, activo, creado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
             ON CONFLICT (id) DO NOTHING`,
            [f.id, f.slug, f.titulo, f.descripcion, f.categoria, f.emailNotificacion || null, JSON.stringify(f.campos), f.activo, f.creadoPor || 'admin']
          );
        }
      }

      const cfgCount = await client.query('SELECT COUNT(*) FROM site_config');
      if (parseInt(cfgCount.rows[0].count, 10) === 0) {
        await client.query(
          `INSERT INTO site_config (id, config_json, zoho_smtp_pass)
           VALUES ('main', $1::jsonb, $2)
           ON CONFLICT (id) DO NOTHING`,
          [JSON.stringify(DEFAULT_SITE_CONFIG), process.env.ZOHO_SMTP_PASS || null]
        );
      }

      isDbInitialized = true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn('PostgreSQL initialization deferred:', (error as Error).message);
  }
}

// =========================================================================
// AUDITORÍA Y RESPALDO PERMANENTE EN BASE DE DATOS
// =========================================================================
export async function recordAuditLogDB(params: {
  entidad: string;
  entidadId: string;
  accion: string;
  actor?: SessionUser | null;
  detalle?: string;
  respaldoJson: Record<string, unknown>;
}) {
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    entidad: params.entidad,
    entidadId: params.entidadId,
    accion: params.accion,
    usuario: params.actor?.username || 'sistema',
    rol: params.actor?.role || 'system',
    detalle: params.detalle,
    respaldoJson: params.respaldoJson,
    createdAt: new Date().toISOString(),
  };
  fallbackAuditLogs.unshift(entry);
  if (fallbackAuditLogs.length > 500) fallbackAuditLogs.pop();

  try {
    await initDatabase();
    await pool.query(
      `INSERT INTO audit_logs (id, entidad, entidad_id, accion, usuario, rol, detalle, respaldo_json)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
      [
        entry.id,
        entry.entidad,
        entry.entidadId,
        entry.accion,
        entry.usuario,
        entry.rol,
        entry.detalle || null,
        JSON.stringify(entry.respaldoJson),
      ]
    );
  } catch (err) {
    console.warn('Audit log fallback only:', (err as Error).message);
  }
}

export async function getAuditLogsDB(limit = 100): Promise<AuditLogEntry[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows.map((r) => ({
      id: r.id,
      entidad: r.entidad,
      entidadId: r.entidad_id,
      accion: r.accion,
      usuario: r.usuario,
      rol: r.rol,
      detalle: r.detalle || undefined,
      respaldoJson: r.respaldo_json || {},
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
    }));
  } catch {
    return fallbackAuditLogs.slice(0, limit);
  }
}

// =========================================================================
// USUARIOS Y AUTENTICACIÓN RBAC
// =========================================================================
export async function authenticateUserDB(
  usernameInput: string,
  passwordInput: string
): Promise<SessionUser | null> {
  const cleanUser = (usernameInput || 'admin').trim().toLowerCase();
  const cleanPass = (passwordInput || '').trim();
  if (!cleanPass) return null;

  // Compatibilidad hacia atrás para login admin con claves maestras históricas/env
  if ((cleanUser === 'admin' || !usernameInput.trim()) && verifyMasterAdminFallback(cleanPass)) {
    return {
      id: 'usr-admin',
      username: 'admin',
      nombre: 'Administración General LLA Brown',
      role: 'admin',
      cargo: 'Administrador del Sistema',
    };
  }

  try {
    await initDatabase();
    const res = await pool.query(
      'SELECT * FROM usuarios WHERE (LOWER(username) = $1 OR LOWER(email) = $1) AND activo = true LIMIT 1',
      [cleanUser]
    );
    if (res.rows.length > 0) {
      const row = res.rows[0];
      if (verifyPasswordHash(cleanPass, row.password_hash)) {
        return {
          id: row.id,
          username: row.username,
          nombre: row.nombre,
          role: row.role === 'admin' ? 'admin' : 'editor',
          cargo: row.cargo,
        };
      }
      return null;
    }
  } catch (err) {
    console.warn('Auth fallback in memory:', (err as Error).message);
    const found = fallbackUsers.find(
      (u) => u.username.toLowerCase() === cleanUser && u.activo
    );
    if (found && verifyPasswordHash(cleanPass, found.passwordHash)) {
      return {
        id: found.id,
        username: found.username,
        nombre: found.nombre,
        role: found.role,
        cargo: found.cargo,
      };
    }
  }

  return null;
}

export async function getUsuariosDB(): Promise<UsuarioSistema[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT id, username, nombre, role, cargo, email, activo, created_at FROM usuarios ORDER BY role ASC, nombre ASC');
    return res.rows.map((r) => ({
      id: r.id,
      username: r.username,
      nombre: r.nombre,
      role: r.role === 'admin' ? 'admin' : 'editor',
      cargo: r.cargo,
      email: r.email || undefined,
      activo: !!r.activo,
      createdAt: r.created_at ? r.created_at.toISOString() : undefined,
    }));
  } catch {
    return fallbackUsers.map(({ passwordHash: _p, ...rest }) => rest);
  }
}

export async function createUsuarioDB(
  input: { username: string; nombre: string; role: 'admin' | 'editor'; cargo: string; email?: string; password: string },
  actor: SessionUser
): Promise<UsuarioSistema> {
  const id = `usr-${Date.now()}`;
  const cleanUsername = input.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
  const passwordHash = hashPassword(input.password);
  const created: UsuarioSistema = {
    id,
    username: cleanUsername,
    nombre: input.nombre.trim(),
    role: input.role === 'admin' ? 'admin' : 'editor',
    cargo: input.cargo.trim(),
    email: input.email?.trim() || undefined,
    activo: true,
    createdAt: new Date().toISOString(),
  };

  try {
    await initDatabase();
    await pool.query(
      `INSERT INTO usuarios (id, username, nombre, role, cargo, email, password_hash, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
      [created.id, created.username, created.nombre, created.role, created.cargo, created.email || null, passwordHash]
    );
  } catch (err) {
    console.warn('createUsuarioDB fallback:', (err as Error).message);
    fallbackUsers.push({ ...created, passwordHash });
  }

  await recordAuditLogDB({
    entidad: 'usuario',
    entidadId: created.id,
    accion: 'crear',
    actor,
    detalle: `Cuenta creada: ${created.username} (${created.role})`,
    respaldoJson: { ...created },
  });
  return created;
}

export async function updateUsuarioDB(
  id: string,
  updates: { nombre?: string; cargo?: string; email?: string; role?: 'admin' | 'editor'; activo?: boolean; password?: string },
  actor: SessionUser
): Promise<UsuarioSistema | null> {
  try {
    await initDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(updates.nombre.trim()); }
    if (updates.cargo !== undefined) { fields.push(`cargo = $${idx++}`); values.push(updates.cargo.trim()); }
    if (updates.email !== undefined) { fields.push(`email = $${idx++}`); values.push(updates.email.trim() || null); }
    if (updates.role !== undefined) { fields.push(`role = $${idx++}`); values.push(updates.role); }
    if (updates.activo !== undefined) { fields.push(`activo = $${idx++}`); values.push(!!updates.activo); }
    if (updates.password && updates.password.trim().length >= 4) {
      fields.push(`password_hash = $${idx++}`);
      values.push(hashPassword(updates.password));
    }

    if (fields.length === 0) return null;
    values.push(id);
    const res = await pool.query(
      `UPDATE usuarios SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, username, nombre, role, cargo, email, activo, created_at`,
      values
    );
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    const updated: UsuarioSistema = {
      id: r.id,
      username: r.username,
      nombre: r.nombre,
      role: r.role === 'admin' ? 'admin' : 'editor',
      cargo: r.cargo,
      email: r.email || undefined,
      activo: !!r.activo,
      createdAt: r.created_at ? r.created_at.toISOString() : undefined,
    };
    await recordAuditLogDB({
      entidad: 'usuario',
      entidadId: id,
      accion: 'actualizar',
      actor,
      detalle: `Actualización de cuenta ${updated.username}`,
      respaldoJson: { ...updated, passwordUpdated: Boolean(updates.password) },
    });
    return updated;
  } catch {
    const idx = fallbackUsers.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const current = fallbackUsers[idx];
    fallbackUsers[idx] = {
      ...current,
      nombre: updates.nombre ?? current.nombre,
      cargo: updates.cargo ?? current.cargo,
      email: updates.email ?? current.email,
      role: updates.role ?? current.role,
      activo: updates.activo ?? current.activo,
      passwordHash: updates.password ? hashPassword(updates.password) : current.passwordHash,
    };
    const { passwordHash: _p, ...clean } = fallbackUsers[idx];
    return clean;
  }
}

// =========================================================================
// PROYECTOS HCD (CON APROBACIÓN Y BORRADO LÓGICO RESPALDADO)
// =========================================================================
function mapProyectoRow(r: any): ProyectoHCD {
  return {
    id: r.id,
    titulo: r.titulo,
    expediente: r.expediente,
    archivoPdf: r.archivo_pdf || undefined,
    archivoNombre: r.archivo_nombre || undefined,
    fecha: r.fecha,
    autor: r.autor,
    localidad: r.localidad,
    categoria: r.categoria,
    estado: r.estado,
    resumen: r.resumen,
    destacado: r.destacado,
    estadoAprobacion: (r.estado_aprobacion as ApprovalStatus) || 'aprobado',
    creadoPor: r.creado_por || 'admin',
    revisadoPor: r.revisado_por || undefined,
    revisadoAt: r.revisado_at ? r.revisado_at.toISOString() : undefined,
    motivoRechazo: r.motivo_rechazo || undefined,
    deletedAt: r.deleted_at ? r.deleted_at.toISOString() : null,
  };
}

export async function getProyectosDB(opts?: {
  includeAll?: boolean;
  createdBy?: string;
}): Promise<ProyectoHCD[]> {
  try {
    await initDatabase();
    if (opts?.includeAll) {
      const res = await pool.query('SELECT * FROM proyectos ORDER BY created_at DESC');
      return res.rows.map(mapProyectoRow);
    }
    if (opts?.createdBy) {
      const res = await pool.query(
        `SELECT * FROM proyectos WHERE deleted_at IS NULL AND (estado_aprobacion = 'aprobado' OR creado_por = $1) ORDER BY created_at DESC`,
        [opts.createdBy]
      );
      return res.rows.map(mapProyectoRow);
    }
    const res = await pool.query(
      `SELECT * FROM proyectos WHERE deleted_at IS NULL AND estado_aprobacion = 'aprobado' ORDER BY created_at DESC`
    );
    return res.rows.map(mapProyectoRow);
  } catch {
    if (opts?.includeAll) return fallbackProyectos;
    if (opts?.createdBy) {
      return fallbackProyectos.filter(
        (p) => !p.deletedAt && (p.estadoAprobacion === 'aprobado' || p.creadoPor === opts.createdBy)
      );
    }
    return fallbackProyectos.filter((p) => !p.deletedAt && p.estadoAprobacion === 'aprobado');
  }
}

export async function createProyectoDB(
  p: ProyectoHCD,
  actor?: SessionUser | null
): Promise<ProyectoHCD> {
  const approval: ApprovalStatus = actor?.role === 'admin' ? 'aprobado' : 'pendiente';
  const creadoPor = actor?.username || 'admin';
  const revisadoPor = actor?.role === 'admin' ? actor.username : undefined;

  const full: ProyectoHCD = {
    ...p,
    estadoAprobacion: approval,
    creadoPor,
    revisadoPor,
    deletedAt: null,
  };

  try {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO proyectos (id, titulo, expediente, archivo_pdf, archivo_nombre, fecha, autor, localidad, categoria, estado, resumen, destacado, estado_aprobacion, creado_por, revisado_por, revisado_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        full.id,
        full.titulo,
        full.expediente || '',
        full.archivoPdf || null,
        full.archivoNombre || null,
        full.fecha,
        full.autor,
        full.localidad,
        full.categoria,
        full.estado,
        full.resumen,
        !!full.destacado,
        approval,
        creadoPor,
        revisadoPor || null,
        revisadoPor ? new Date() : null,
      ]
    );
    const created = mapProyectoRow(res.rows[0]);
    fallbackProyectos.unshift(created);
    await recordAuditLogDB({
      entidad: 'proyecto',
      entidadId: created.id,
      accion: approval === 'pendiente' ? 'enviar_a_revision' : 'crear_publicado',
      actor,
      detalle: created.titulo,
      respaldoJson: { ...created },
    });
    return created;
  } catch {
    fallbackProyectos.unshift(full);
    return full;
  }
}

export async function reviewProyectoDB(
  id: string,
  decision: 'aprobado' | 'rechazado',
  actor: SessionUser,
  motivoRechazo?: string
): Promise<ProyectoHCD | null> {
  try {
    await initDatabase();
    const res = await pool.query(
      `UPDATE proyectos
       SET estado_aprobacion = $1, revisado_por = $2, revisado_at = NOW(), motivo_rechazo = $3, deleted_at = NULL
       WHERE id = $4 RETURNING *`,
      [decision, actor.username, decision === 'rechazado' ? motivoRechazo || null : null, id]
    );
    if (res.rows.length === 0) return null;
    const updated = mapProyectoRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'proyecto',
      entidadId: id,
      accion: decision === 'aprobado' ? 'aprobar' : 'rechazar',
      actor,
      detalle: motivoRechazo || updated.titulo,
      respaldoJson: { ...updated },
    });
    return updated;
  } catch {
    const idx = fallbackProyectos.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    fallbackProyectos[idx] = {
      ...fallbackProyectos[idx],
      estadoAprobacion: decision,
      revisadoPor: actor.username,
      revisadoAt: new Date().toISOString(),
      motivoRechazo: decision === 'rechazado' ? motivoRechazo : undefined,
      deletedAt: null,
    };
    return fallbackProyectos[idx];
  }
}

export async function deleteProyectoDB(id: string, actor?: SessionUser | null): Promise<boolean> {
  try {
    await initDatabase();
    const res = await pool.query(
      `UPDATE proyectos SET deleted_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );
    if (res.rows.length === 0) return false;
    const archived = mapProyectoRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'proyecto',
      entidadId: id,
      accion: 'archivar_eliminado',
      actor,
      detalle: `Respaldo automático al eliminar proyecto: ${archived.titulo}`,
      respaldoJson: { ...archived },
    });
    return true;
  } catch {
    const item = fallbackProyectos.find((p) => p.id === id);
    if (!item) return false;
    item.deletedAt = new Date().toISOString();
    return true;
  }
}

// =========================================================================
// VISITAS / RECORRIDAS TERRITORIALES (CON APROBACIÓN Y RESPALDO)
// =========================================================================
function mapVisitaRow(r: any): VisitaTerritorial {
  return {
    id: r.id,
    titulo: r.titulo,
    localidad: r.localidad,
    circuito: r.circuito,
    fecha: r.fecha,
    descripcion: r.descripcion,
    fotos: r.fotos || [],
    concejales: r.concejales || [],
    temasTratados: r.temas_tratados || [],
    estadoAprobacion: (r.estado_aprobacion as ApprovalStatus) || 'aprobado',
    creadoPor: r.creado_por || 'admin',
    revisadoPor: r.revisado_por || undefined,
    revisadoAt: r.revisado_at ? r.revisado_at.toISOString() : undefined,
    motivoRechazo: r.motivo_rechazo || undefined,
    deletedAt: r.deleted_at ? r.deleted_at.toISOString() : null,
  };
}

export async function getVisitasDB(opts?: {
  includeAll?: boolean;
  createdBy?: string;
}): Promise<VisitaTerritorial[]> {
  try {
    await initDatabase();
    if (opts?.includeAll) {
      const res = await pool.query('SELECT * FROM visitas ORDER BY created_at DESC');
      return res.rows.map(mapVisitaRow);
    }
    if (opts?.createdBy) {
      const res = await pool.query(
        `SELECT * FROM visitas WHERE deleted_at IS NULL AND (estado_aprobacion = 'aprobado' OR creado_por = $1) ORDER BY created_at DESC`,
        [opts.createdBy]
      );
      return res.rows.map(mapVisitaRow);
    }
    const res = await pool.query(
      `SELECT * FROM visitas WHERE deleted_at IS NULL AND estado_aprobacion = 'aprobado' ORDER BY created_at DESC`
    );
    return res.rows.map(mapVisitaRow);
  } catch {
    if (opts?.includeAll) return fallbackVisitas;
    if (opts?.createdBy) {
      return fallbackVisitas.filter(
        (v) => !v.deletedAt && (v.estadoAprobacion === 'aprobado' || v.creadoPor === opts.createdBy)
      );
    }
    return fallbackVisitas.filter((v) => !v.deletedAt && v.estadoAprobacion === 'aprobado');
  }
}

export async function createVisitaDB(
  v: VisitaTerritorial,
  actor?: SessionUser | null
): Promise<VisitaTerritorial> {
  const approval: ApprovalStatus = actor?.role === 'admin' ? 'aprobado' : 'pendiente';
  const creadoPor = actor?.username || 'admin';
  const revisadoPor = actor?.role === 'admin' ? actor.username : undefined;
  const full: VisitaTerritorial = {
    ...v,
    estadoAprobacion: approval,
    creadoPor,
    revisadoPor,
    deletedAt: null,
  };

  try {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO visitas (id, titulo, localidad, circuito, fecha, descripcion, fotos, concejales, temas_tratados, estado_aprobacion, creado_por, revisado_por, revisado_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        full.id,
        full.titulo,
        full.localidad,
        full.circuito || '',
        full.fecha,
        full.descripcion,
        full.fotos,
        full.concejales,
        full.temasTratados,
        approval,
        creadoPor,
        revisadoPor || null,
        revisadoPor ? new Date() : null,
      ]
    );
    const created = mapVisitaRow(res.rows[0]);
    fallbackVisitas.unshift(created);
    await recordAuditLogDB({
      entidad: 'visita',
      entidadId: created.id,
      accion: approval === 'pendiente' ? 'enviar_a_revision' : 'crear_publicado',
      actor,
      detalle: created.titulo,
      respaldoJson: { ...created },
    });
    return created;
  } catch {
    fallbackVisitas.unshift(full);
    return full;
  }
}

export async function reviewVisitaDB(
  id: string,
  decision: 'aprobado' | 'rechazado',
  actor: SessionUser,
  motivoRechazo?: string
): Promise<VisitaTerritorial | null> {
  try {
    await initDatabase();
    const res = await pool.query(
      `UPDATE visitas
       SET estado_aprobacion = $1, revisado_por = $2, revisado_at = NOW(), motivo_rechazo = $3, deleted_at = NULL
       WHERE id = $4 RETURNING *`,
      [decision, actor.username, decision === 'rechazado' ? motivoRechazo || null : null, id]
    );
    if (res.rows.length === 0) return null;
    const updated = mapVisitaRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'visita',
      entidadId: id,
      accion: decision === 'aprobado' ? 'aprobar' : 'rechazar',
      actor,
      detalle: motivoRechazo || updated.titulo,
      respaldoJson: { ...updated },
    });
    return updated;
  } catch {
    const idx = fallbackVisitas.findIndex((v) => v.id === id);
    if (idx === -1) return null;
    fallbackVisitas[idx] = {
      ...fallbackVisitas[idx],
      estadoAprobacion: decision,
      revisadoPor: actor.username,
      revisadoAt: new Date().toISOString(),
      motivoRechazo: decision === 'rechazado' ? motivoRechazo : undefined,
      deletedAt: null,
    };
    return fallbackVisitas[idx];
  }
}

export async function deleteVisitaDB(id: string, actor?: SessionUser | null): Promise<boolean> {
  try {
    await initDatabase();
    const res = await pool.query(`UPDATE visitas SET deleted_at = NOW() WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) return false;
    const archived = mapVisitaRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'visita',
      entidadId: id,
      accion: 'archivar_eliminado',
      actor,
      detalle: `Respaldo automático al eliminar recorrida: ${archived.titulo}`,
      respaldoJson: { ...archived },
    });
    return true;
  } catch {
    const item = fallbackVisitas.find((v) => v.id === id);
    if (!item) return false;
    item.deletedAt = new Date().toISOString();
    return true;
  }
}

// =========================================================================
// NOTICIAS (NACIÓN, PROVINCIA, DISTRITO, NOVEDADES)
// =========================================================================
function mapNoticiaRow(r: any): NoticiaItem {
  return {
    id: r.id,
    titulo: r.titulo,
    bajada: r.bajada,
    cuerpo: r.cuerpo,
    ambito: r.ambito,
    localidad: r.localidad || undefined,
    imagenUrl: r.imagen_url || undefined,
    fuenteUrl: r.fuente_url || undefined,
    autor: r.autor,
    fecha: r.fecha,
    destacada: !!r.destacada,
    estadoAprobacion: (r.estado_aprobacion as ApprovalStatus) || 'pendiente',
    creadoPor: r.creado_por || 'admin',
    revisadoPor: r.revisado_por || undefined,
    revisadoAt: r.revisado_at ? r.revisado_at.toISOString() : undefined,
    motivoRechazo: r.motivo_rechazo || undefined,
    deletedAt: r.deleted_at ? r.deleted_at.toISOString() : null,
    createdAt: r.created_at ? r.created_at.toISOString() : undefined,
  };
}

export async function getNoticiasDB(opts?: {
  includeAll?: boolean;
  createdBy?: string;
  ambito?: string;
}): Promise<NoticiaItem[]> {
  try {
    await initDatabase();
    let res;
    if (opts?.includeAll) {
      res = await pool.query('SELECT * FROM noticias ORDER BY created_at DESC');
    } else if (opts?.createdBy) {
      res = await pool.query(
        `SELECT * FROM noticias WHERE deleted_at IS NULL AND (estado_aprobacion = 'aprobado' OR creado_por = $1) ORDER BY created_at DESC`,
        [opts.createdBy]
      );
    } else {
      res = await pool.query(
        `SELECT * FROM noticias WHERE deleted_at IS NULL AND estado_aprobacion = 'aprobado' ORDER BY destacada DESC, created_at DESC`
      );
    }
    const items = res.rows.map(mapNoticiaRow);
    return opts?.ambito && opts.ambito !== 'Todas'
      ? items.filter((n) => n.ambito === opts.ambito)
      : items;
  } catch {
    let items = fallbackNoticias;
    if (!opts?.includeAll) {
      items = opts?.createdBy
        ? items.filter((n) => !n.deletedAt && (n.estadoAprobacion === 'aprobado' || n.creadoPor === opts.createdBy))
        : items.filter((n) => !n.deletedAt && n.estadoAprobacion === 'aprobado');
    }
    return opts?.ambito && opts.ambito !== 'Todas'
      ? items.filter((n) => n.ambito === opts.ambito)
      : items;
  }
}

export async function createNoticiaDB(
  n: Omit<NoticiaItem, 'estadoAprobacion'>,
  actor: SessionUser
): Promise<NoticiaItem> {
  const approval: ApprovalStatus = actor.role === 'admin' ? 'aprobado' : 'pendiente';
  const full: NoticiaItem = {
    ...n,
    estadoAprobacion: approval,
    creadoPor: actor.username,
    revisadoPor: actor.role === 'admin' ? actor.username : undefined,
    deletedAt: null,
    createdAt: new Date().toISOString(),
  };

  try {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO noticias (id, titulo, bajada, cuerpo, ambito, localidad, imagen_url, fuente_url, autor, fecha, destacada, estado_aprobacion, creado_por, revisado_por, revisado_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        full.id,
        full.titulo,
        full.bajada,
        full.cuerpo,
        full.ambito,
        full.localidad || null,
        full.imagenUrl || null,
        full.fuenteUrl || null,
        full.autor,
        full.fecha,
        !!full.destacada,
        approval,
        actor.username,
        actor.role === 'admin' ? actor.username : null,
        actor.role === 'admin' ? new Date() : null,
      ]
    );
    const created = mapNoticiaRow(res.rows[0]);
    fallbackNoticias.unshift(created);
    await recordAuditLogDB({
      entidad: 'noticia',
      entidadId: created.id,
      accion: approval === 'pendiente' ? 'enviar_a_revision' : 'crear_publicado',
      actor,
      detalle: `[${created.ambito}] ${created.titulo}`,
      respaldoJson: { ...created },
    });
    return created;
  } catch {
    fallbackNoticias.unshift(full);
    return full;
  }
}

export async function reviewNoticiaDB(
  id: string,
  decision: 'aprobado' | 'rechazado',
  actor: SessionUser,
  motivoRechazo?: string
): Promise<NoticiaItem | null> {
  try {
    await initDatabase();
    const res = await pool.query(
      `UPDATE noticias
       SET estado_aprobacion = $1, revisado_por = $2, revisado_at = NOW(), motivo_rechazo = $3, deleted_at = NULL
       WHERE id = $4 RETURNING *`,
      [decision, actor.username, decision === 'rechazado' ? motivoRechazo || null : null, id]
    );
    if (res.rows.length === 0) return null;
    const updated = mapNoticiaRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'noticia',
      entidadId: id,
      accion: decision === 'aprobado' ? 'aprobar' : 'rechazar',
      actor,
      detalle: motivoRechazo || updated.titulo,
      respaldoJson: { ...updated },
    });
    return updated;
  } catch {
    const idx = fallbackNoticias.findIndex((n) => n.id === id);
    if (idx === -1) return null;
    fallbackNoticias[idx] = {
      ...fallbackNoticias[idx],
      estadoAprobacion: decision,
      revisadoPor: actor.username,
      revisadoAt: new Date().toISOString(),
      motivoRechazo: decision === 'rechazado' ? motivoRechazo : undefined,
      deletedAt: null,
    };
    return fallbackNoticias[idx];
  }
}

export async function deleteNoticiaDB(id: string, actor: SessionUser): Promise<boolean> {
  try {
    await initDatabase();
    const res = await pool.query(`UPDATE noticias SET deleted_at = NOW() WHERE id = $1 RETURNING *`, [id]);
    if (res.rows.length === 0) return false;
    const archived = mapNoticiaRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'noticia',
      entidadId: id,
      accion: 'archivar_eliminado',
      actor,
      detalle: `Respaldo automático al eliminar noticia: ${archived.titulo}`,
      respaldoJson: { ...archived },
    });
    return true;
  } catch {
    const item = fallbackNoticias.find((n) => n.id === id);
    if (!item) return false;
    item.deletedAt = new Date().toISOString();
    return true;
  }
}

// =========================================================================
// EQUIPO Y LEGISLADORES PROVINCIALES / NACIONALES (DINÁMICOS + FOTOS)
// =========================================================================
function mapEquipoRow(r: any): MiembroEquipo {
  return {
    id: r.id,
    nombre: r.nombre,
    rol: r.rol,
    localidad: r.localidad,
    foto: r.foto,
    estilo: r.estilo || undefined,
    tipo: r.tipo,
    bio: r.bio || undefined,
    orden: r.orden ?? 10,
    activo: r.activo !== false,
    redes: r.instagram || r.twitter ? { instagram: r.instagram || undefined, twitter: r.twitter || undefined } : undefined,
  };
}

export async function getMiembrosEquipoDB(includeInactive = false): Promise<MiembroEquipo[]> {
  try {
    await initDatabase();
    const q = includeInactive
      ? 'SELECT * FROM miembros_equipo ORDER BY tipo ASC, orden ASC, nombre ASC'
      : 'SELECT * FROM miembros_equipo WHERE activo = true ORDER BY tipo ASC, orden ASC, nombre ASC';
    const res = await pool.query(q);
    return res.rows.map(mapEquipoRow);
  } catch {
    return includeInactive ? fallbackEquipo : fallbackEquipo.filter((m) => m.activo !== false);
  }
}

export async function createMiembroEquipoDB(
  m: MiembroEquipo,
  actor: SessionUser
): Promise<MiembroEquipo> {
  const full: MiembroEquipo = {
    ...m,
    id: m.id || `eq-${Date.now()}`,
    orden: m.orden ?? 10,
    activo: true,
  };
  try {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO miembros_equipo (id, nombre, rol, localidad, foto, estilo, tipo, bio, instagram, twitter, orden, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true) RETURNING *`,
      [
        full.id,
        full.nombre,
        full.rol,
        full.localidad,
        full.foto || '/img/a6.jpg',
        full.estilo || null,
        full.tipo,
        full.bio || null,
        full.redes?.instagram || null,
        full.redes?.twitter || null,
        full.orden,
      ]
    );
    const created = mapEquipoRow(res.rows[0]);
    fallbackEquipo.push(created);
    await recordAuditLogDB({
      entidad: 'miembro_equipo',
      entidadId: created.id,
      accion: 'crear',
      actor,
      detalle: `${created.nombre} (${created.tipo})`,
      respaldoJson: { ...created },
    });
    return created;
  } catch {
    fallbackEquipo.push(full);
    return full;
  }
}

export async function updateMiembroEquipoDB(
  id: string,
  updates: Partial<MiembroEquipo>,
  actor: SessionUser
): Promise<MiembroEquipo | null> {
  try {
    await initDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(updates.nombre); }
    if (updates.rol !== undefined) { fields.push(`rol = $${idx++}`); values.push(updates.rol); }
    if (updates.localidad !== undefined) { fields.push(`localidad = $${idx++}`); values.push(updates.localidad); }
    if (updates.foto !== undefined) { fields.push(`foto = $${idx++}`); values.push(updates.foto); }
    if (updates.estilo !== undefined) { fields.push(`estilo = $${idx++}`); values.push(updates.estilo || null); }
    if (updates.tipo !== undefined) { fields.push(`tipo = $${idx++}`); values.push(updates.tipo); }
    if (updates.bio !== undefined) { fields.push(`bio = $${idx++}`); values.push(updates.bio || null); }
    if (updates.orden !== undefined) { fields.push(`orden = $${idx++}`); values.push(updates.orden); }
    if (updates.activo !== undefined) { fields.push(`activo = $${idx++}`); values.push(!!updates.activo); }
    if (updates.redes !== undefined) {
      fields.push(`instagram = $${idx++}`);
      values.push(updates.redes?.instagram || null);
      fields.push(`twitter = $${idx++}`);
      values.push(updates.redes?.twitter || null);
    }

    if (fields.length === 0) return null;
    values.push(id);
    const res = await pool.query(
      `UPDATE miembros_equipo SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (res.rows.length === 0) return null;
    const updated = mapEquipoRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'miembro_equipo',
      entidadId: id,
      accion: 'actualizar',
      actor,
      detalle: `Actualizado ${updated.nombre}`,
      respaldoJson: { ...updated },
    });
    return updated;
  } catch {
    const idx = fallbackEquipo.findIndex((m) => m.id === id);
    if (idx === -1) return null;
    fallbackEquipo[idx] = { ...fallbackEquipo[idx], ...updates };
    return fallbackEquipo[idx];
  }
}

export async function deleteMiembroEquipoDB(id: string, actor: SessionUser): Promise<boolean> {
  const res = await updateMiembroEquipoDB(id, { activo: false }, actor);
  return res !== null;
}

// =========================================================================
// LOCALIDADES DINÁMICAS (AÑADIR / EDITAR / QUITAR CON RESPALDO)
// =========================================================================
function mapLocalidadRow(r: any): LocalidadInfo {
  return {
    id: r.id,
    nombre: r.nombre,
    circuito: r.circuito,
    wa: r.wa,
    descripcion: r.descripcion,
    coordenadas: [Number(r.lat), Number(r.lng)],
    hitos: r.hitos || [],
    referenteNombre: r.referente_nombre,
    destacado: r.destacado,
    orden: r.orden ?? 10,
    activo: r.activo !== false,
  };
}

export async function getLocalidadesDB(includeInactive = false): Promise<LocalidadInfo[]> {
  try {
    await initDatabase();
    const q = includeInactive
      ? 'SELECT * FROM localidades ORDER BY orden ASC, nombre ASC'
      : 'SELECT * FROM localidades WHERE activo = true ORDER BY orden ASC, nombre ASC';
    const res = await pool.query(q);
    return res.rows.map(mapLocalidadRow);
  } catch {
    return includeInactive ? fallbackLocalidades : fallbackLocalidades.filter((l) => l.activo !== false);
  }
}

export async function createLocalidadDB(
  loc: LocalidadInfo,
  actor: SessionUser
): Promise<LocalidadInfo> {
  const slugId =
    loc.id ||
    loc.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    `loc-${Date.now()}`;

  const full: LocalidadInfo = {
    ...loc,
    id: slugId,
    wa: loc.wa || 'https://wa.me/5491131596936',
    coordenadas: loc.coordenadas || [-34.81, -58.38],
    hitos: loc.hitos || [],
    orden: loc.orden ?? 20,
    activo: true,
  };

  try {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO localidades (id, nombre, circuito, wa, descripcion, lat, lng, hitos, referente_nombre, destacado, orden, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true)
       ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre, circuito = EXCLUDED.circuito, descripcion = EXCLUDED.descripcion, referente_nombre = EXCLUDED.referente_nombre, activo = true
       RETURNING *`,
      [
        full.id,
        full.nombre,
        full.circuito || '0019',
        full.wa,
        full.descripcion || '',
        full.coordenadas[0],
        full.coordenadas[1],
        full.hitos,
        full.referenteNombre || `Equipo Territorial ${full.nombre}`,
        full.destacado || '',
        full.orden,
      ]
    );
    const created = mapLocalidadRow(res.rows[0]);
    fallbackLocalidades.push(created);
    await recordAuditLogDB({
      entidad: 'localidad',
      entidadId: created.id,
      accion: 'crear',
      actor,
      detalle: `Localidad agregada: ${created.nombre}`,
      respaldoJson: { ...created },
    });
    return created;
  } catch {
    fallbackLocalidades.push(full);
    return full;
  }
}

export async function updateLocalidadDB(
  id: string,
  updates: Partial<LocalidadInfo>,
  actor: SessionUser
): Promise<LocalidadInfo | null> {
  try {
    await initDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.nombre !== undefined) { fields.push(`nombre = $${idx++}`); values.push(updates.nombre); }
    if (updates.circuito !== undefined) { fields.push(`circuito = $${idx++}`); values.push(updates.circuito); }
    if (updates.descripcion !== undefined) { fields.push(`descripcion = $${idx++}`); values.push(updates.descripcion); }
    if (updates.referenteNombre !== undefined) { fields.push(`referente_nombre = $${idx++}`); values.push(updates.referenteNombre); }
    if (updates.destacado !== undefined) { fields.push(`destacado = $${idx++}`); values.push(updates.destacado); }
    if (updates.hitos !== undefined) { fields.push(`hitos = $${idx++}`); values.push(updates.hitos); }
    if (updates.activo !== undefined) { fields.push(`activo = $${idx++}`); values.push(!!updates.activo); }
    if (updates.orden !== undefined) { fields.push(`orden = $${idx++}`); values.push(updates.orden); }

    if (fields.length === 0) return null;
    values.push(id);
    const res = await pool.query(
      `UPDATE localidades SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );
    if (res.rows.length === 0) return null;
    const updated = mapLocalidadRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'localidad',
      entidadId: id,
      accion: updates.activo === false ? 'archivar_eliminado' : 'actualizar',
      actor,
      detalle: updated.nombre,
      respaldoJson: { ...updated },
    });
    return updated;
  } catch {
    const idx = fallbackLocalidades.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    fallbackLocalidades[idx] = { ...fallbackLocalidades[idx], ...updates };
    return fallbackLocalidades[idx];
  }
}

// =========================================================================
// FORMULARIOS DINÁMICOS Y RESPUESTAS (ADIÓS GOOGLE FORMS)
// =========================================================================
function mapFormularioRow(r: any): FormularioDinamico {
  return {
    id: r.id,
    slug: r.slug,
    titulo: r.titulo,
    descripcion: r.descripcion,
    categoria: r.categoria,
    emailNotificacion: r.email_notificacion || undefined,
    campos: Array.isArray(r.campos_json) ? r.campos_json : [],
    activo: r.activo !== false,
    respuestasCount: r.respuestas_count !== undefined ? Number(r.respuestas_count) : undefined,
    creadoPor: r.creado_por || 'admin',
    createdAt: r.created_at ? r.created_at.toISOString() : undefined,
    deletedAt: r.deleted_at ? r.deleted_at.toISOString() : null,
  };
}

export async function getFormulariosDB(includeInactive = false): Promise<FormularioDinamico[]> {
  try {
    await initDatabase();
    const whereClause = includeInactive
      ? 'WHERE f.deleted_at IS NULL'
      : 'WHERE f.deleted_at IS NULL AND f.activo = true';
    const res = await pool.query(`
      SELECT f.*, COUNT(r.id) AS respuestas_count
      FROM formularios f
      LEFT JOIN formulario_respuestas r ON r.formulario_slug = f.slug
      ${whereClause}
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `);
    return res.rows.map(mapFormularioRow);
  } catch {
    return (includeInactive ? fallbackFormularios : fallbackFormularios.filter((f) => f.activo)).map((f) => ({
      ...f,
      respuestasCount: fallbackRespuestas.filter((r) => r.formularioSlug === f.slug).length,
    }));
  }
}

export async function getFormularioBySlugDB(slug: string): Promise<FormularioDinamico | null> {
  try {
    await initDatabase();
    const res = await pool.query(
      'SELECT * FROM formularios WHERE slug = $1 AND deleted_at IS NULL LIMIT 1',
      [slug.toLowerCase()]
    );
    if (res.rows.length === 0) return null;
    return mapFormularioRow(res.rows[0]);
  } catch {
    return fallbackFormularios.find((f) => f.slug === slug.toLowerCase() && !f.deletedAt) || null;
  }
}

export async function createFormularioDB(
  form: Omit<FormularioDinamico, 'id'>,
  actor: SessionUser
): Promise<FormularioDinamico> {
  const cleanSlug = form.slug
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '') || `form-${Date.now()}`;

  const full: FormularioDinamico = {
    ...form,
    id: `form-${Date.now()}`,
    slug: cleanSlug,
    creadoPor: actor.username,
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };

  try {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO formularios (id, slug, titulo, descripcion, categoria, email_notificacion, campos_json, activo, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9) RETURNING *`,
      [
        full.id,
        full.slug,
        full.titulo,
        full.descripcion,
        full.categoria || 'General',
        full.emailNotificacion || null,
        JSON.stringify(full.campos),
        full.activo !== false,
        actor.username,
      ]
    );
    const created = mapFormularioRow(res.rows[0]);
    fallbackFormularios.unshift(created);
    await recordAuditLogDB({
      entidad: 'formulario',
      entidadId: created.id,
      accion: 'crear',
      actor,
      detalle: `/f/${created.slug} — ${created.titulo}`,
      respaldoJson: { ...created },
    });
    return created;
  } catch {
    fallbackFormularios.unshift(full);
    return full;
  }
}

export async function updateFormularioDB(
  slugOrId: string,
  updates: Partial<FormularioDinamico>,
  actor: SessionUser
): Promise<FormularioDinamico | null> {
  try {
    await initDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.titulo !== undefined) { fields.push(`titulo = $${idx++}`); values.push(updates.titulo); }
    if (updates.descripcion !== undefined) { fields.push(`descripcion = $${idx++}`); values.push(updates.descripcion); }
    if (updates.categoria !== undefined) { fields.push(`categoria = $${idx++}`); values.push(updates.categoria); }
    if (updates.emailNotificacion !== undefined) { fields.push(`email_notificacion = $${idx++}`); values.push(updates.emailNotificacion || null); }
    if (updates.campos !== undefined) { fields.push(`campos_json = $${idx++}::jsonb`); values.push(JSON.stringify(updates.campos)); }
    if (updates.activo !== undefined) { fields.push(`activo = $${idx++}`); values.push(!!updates.activo); }

    if (fields.length === 0) return null;
    values.push(slugOrId);
    const res = await pool.query(
      `UPDATE formularios SET ${fields.join(', ')} WHERE id = $${idx} OR slug = $${idx} RETURNING *`,
      values
    );
    if (res.rows.length === 0) return null;
    const updated = mapFormularioRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'formulario',
      entidadId: updated.id,
      accion: 'actualizar',
      actor,
      detalle: updated.titulo,
      respaldoJson: { ...updated },
    });
    return updated;
  } catch {
    const idx = fallbackFormularios.findIndex((f) => f.id === slugOrId || f.slug === slugOrId);
    if (idx === -1) return null;
    fallbackFormularios[idx] = { ...fallbackFormularios[idx], ...updates };
    return fallbackFormularios[idx];
  }
}

export async function deleteFormularioDB(slugOrId: string, actor: SessionUser): Promise<boolean> {
  try {
    await initDatabase();
    const res = await pool.query(
      `UPDATE formularios SET deleted_at = NOW(), activo = false WHERE id = $1 OR slug = $1 RETURNING *`,
      [slugOrId]
    );
    if (res.rows.length === 0) return false;
    const archived = mapFormularioRow(res.rows[0]);
    await recordAuditLogDB({
      entidad: 'formulario',
      entidadId: archived.id,
      accion: 'archivar_eliminado',
      actor,
      detalle: archived.titulo,
      respaldoJson: { ...archived },
    });
    return true;
  } catch {
    const f = fallbackFormularios.find((x) => x.id === slugOrId || x.slug === slugOrId);
    if (!f) return false;
    f.deletedAt = new Date().toISOString();
    f.activo = false;
    return true;
  }
}

export async function createFormularioRespuestaDB(
  formularioId: string,
  formularioSlug: string,
  datos: Record<string, string | boolean>
): Promise<FormularioRespuesta> {
  const entry: FormularioRespuesta = {
    id: `resp-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    formularioId,
    formularioSlug,
    datos,
    createdAt: new Date().toISOString(),
  };

  try {
    await initDatabase();
    await pool.query(
      `INSERT INTO formulario_respuestas (id, formulario_id, formulario_slug, datos_json)
       VALUES ($1, $2, $3, $4::jsonb)`,
      [entry.id, entry.formularioId, entry.formularioSlug, JSON.stringify(entry.datos)]
    );
  } catch {
    fallbackRespuestas.unshift(entry);
  }
  return entry;
}

export async function getFormularioRespuestasDB(slugOrId: string): Promise<FormularioRespuesta[]> {
  try {
    await initDatabase();
    const res = await pool.query(
      `SELECT * FROM formulario_respuestas WHERE formulario_slug = $1 OR formulario_id = $1 ORDER BY created_at DESC`,
      [slugOrId]
    );
    return res.rows.map((r) => ({
      id: r.id,
      formularioId: r.formulario_id,
      formularioSlug: r.formulario_slug,
      datos: r.datos_json || {},
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
    }));
  } catch {
    return fallbackRespuestas.filter((r) => r.formularioSlug === slugOrId || r.formularioId === slugOrId);
  }
}

// =========================================================================
// CONFIGURACIÓN DINÁMICA DEL SITIO Y SMTP ZOHO
// =========================================================================
export async function getSiteConfigWithSecretsDB(): Promise<{
  config: SiteConfig;
  smtpPass: string;
  zohoAccounts: Record<string, string>;
}> {
  try {
    await initDatabase();
    const res = await pool.query(
      `SELECT config_json, zoho_smtp_pass, zoho_accounts_json FROM site_config WHERE id = 'main' LIMIT 1`
    );
    if (res.rows.length > 0) {
      const merged: SiteConfig = { ...DEFAULT_SITE_CONFIG, ...(res.rows[0].config_json || {}) };
      const pass = res.rows[0].zoho_smtp_pass || process.env.ZOHO_SMTP_PASS || '';
      const accounts: Record<string, string> =
        res.rows[0].zoho_accounts_json && typeof res.rows[0].zoho_accounts_json === 'object'
          ? res.rows[0].zoho_accounts_json
          : {};
      merged.zohoSmtpConfigured = Boolean((merged.zohoSmtpUser && pass) || Object.keys(accounts).length > 0);
      return { config: merged, smtpPass: pass, zohoAccounts: accounts };
    }
  } catch {
    // fallback
  }
  const pass = fallbackSmtpPass || process.env.ZOHO_SMTP_PASS || '';
  return {
    config: { ...fallbackSiteConfig, zohoSmtpConfigured: Boolean(fallbackSiteConfig.zohoSmtpUser && pass) },
    smtpPass: pass,
    zohoAccounts: {},
  };
}

export async function getSiteConfigDB(): Promise<SiteConfig> {
  const { config } = await getSiteConfigWithSecretsDB();
  return config;
}

export async function updateSiteConfigDB(
  updates: Partial<SiteConfig>,
  smtpPass?: string,
  actor?: SessionUser
): Promise<SiteConfig> {
  const { config: current, smtpPass: currentPass, zohoAccounts: currentAccounts } =
    await getSiteConfigWithSecretsDB();
  const nextConfig: SiteConfig = {
    ...current,
    ...updates,
  };
  const nextPass = smtpPass !== undefined && smtpPass.trim().length > 0 ? smtpPass.trim() : currentPass;
  const nextAccounts: Record<string, string> = { ...currentAccounts };
  if (smtpPass !== undefined && smtpPass.trim().length > 0 && nextConfig.zohoSmtpUser) {
    nextAccounts[nextConfig.zohoSmtpUser.trim().toLowerCase()] = smtpPass.trim();
  }
  nextConfig.zohoSmtpConfigured = Boolean(
    (nextConfig.zohoSmtpUser && nextPass) || Object.keys(nextAccounts).length > 0
  );

  fallbackSiteConfig = nextConfig;
  fallbackSmtpPass = nextPass;

  try {
    await initDatabase();
    await pool.query(
      `INSERT INTO site_config (id, config_json, zoho_smtp_pass, zoho_accounts_json, updated_at)
       VALUES ('main', $1::jsonb, $2, $3::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET config_json = EXCLUDED.config_json, zoho_smtp_pass = EXCLUDED.zoho_smtp_pass, zoho_accounts_json = EXCLUDED.zoho_accounts_json, updated_at = NOW()`,
      [JSON.stringify(nextConfig), nextPass || null, JSON.stringify(nextAccounts)]
    );
  } catch (err) {
    console.warn('updateSiteConfigDB fallback:', (err as Error).message);
  }

  await recordAuditLogDB({
    entidad: 'site_config',
    entidadId: 'main',
    accion: 'actualizar',
    actor,
    detalle: 'Actualización de configuración institucional / Zoho SMTP',
    respaldoJson: { ...nextConfig },
  });

  return nextConfig;
}

// =========================================================================
// HISTORIAL DE CORREOS ZOHO
// =========================================================================
export async function logCorreoEnviadoDB(entry: CorreoEnviado): Promise<void> {
  fallbackCorreos.unshift(entry);
  try {
    await initDatabase();
    await pool.query(
      `INSERT INTO correos_enviados (id, remitente, destinatarios, asunto, cuerpo, estado, error_detalle, enviado_por)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.id,
        entry.remitente,
        entry.destinatarios,
        entry.asunto,
        entry.cuerpo,
        entry.estado,
        entry.errorDetalle || null,
        entry.enviadoPor,
      ]
    );
  } catch (err) {
    console.warn('logCorreoEnviadoDB fallback:', (err as Error).message);
  }
}

export async function getCorreosEnviadosDB(): Promise<CorreoEnviado[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT * FROM correos_enviados ORDER BY created_at DESC LIMIT 100');
    return res.rows.map((r) => ({
      id: r.id,
      remitente: r.remitente,
      destinatarios: r.destinatarios || [],
      asunto: r.asunto,
      cuerpo: r.cuerpo,
      estado: r.estado,
      errorDetalle: r.error_detalle || undefined,
      enviadoPor: r.enviado_por,
      createdAt: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
    }));
  } catch {
    return fallbackCorreos;
  }
}

// =========================================================================
// PINES TERRITORIALES Y RECLAMOS VECINALES (EXISTENTES + AUDITORÍA)
// =========================================================================
export async function getPinesDB(): Promise<PinTerritorial[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT * FROM pines_territoriales ORDER BY created_at DESC');
    return res.rows.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      calle: r.calle,
      localidad: r.localidad,
      barrio: r.barrio || undefined,
      lat: r.lat,
      lng: r.lng,
      categoria: r.categoria,
      estado: r.estado,
      descripcion: r.descripcion,
      concejal: r.concejal,
      fotos: r.fotos || [],
      pdfUrl: r.pdf_url,
      pdfNombre: r.pdf_nombre,
      fecha: r.fecha,
      apoyosVecinales: r.apoyos_vecinales || 0,
    }));
  } catch {
    return fallbackPines;
  }
}

export async function createPinDB(pin: PinTerritorial): Promise<PinTerritorial> {
  try {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO pines_territoriales (id, titulo, calle, localidad, barrio, lat, lng, categoria, estado, descripcion, concejal, fotos, pdf_url, pdf_nombre, fecha, apoyos_vecinales)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        pin.id,
        pin.titulo,
        pin.calle,
        pin.localidad,
        pin.barrio || null,
        pin.lat,
        pin.lng,
        pin.categoria,
        pin.estado,
        pin.descripcion,
        pin.concejal,
        pin.fotos,
        pin.pdfUrl || null,
        pin.pdfNombre || null,
        pin.fecha,
        pin.apoyosVecinales || 0,
      ]
    );
    return { ...res.rows[0], barrio: res.rows[0].barrio || undefined };
  } catch {
    fallbackPines.unshift(pin);
    return pin;
  }
}

export async function deletePinDB(id: string, actor?: SessionUser | null): Promise<boolean> {
  try {
    await initDatabase();
    const prev = await pool.query('SELECT * FROM pines_territoriales WHERE id = $1', [id]);
    const res = await pool.query('DELETE FROM pines_territoriales WHERE id = $1', [id]);
    if ((res.rowCount || 0) > 0 && prev.rows[0]) {
      await recordAuditLogDB({
        entidad: 'pin_territorial',
        entidadId: id,
        accion: 'eliminar_con_respaldo',
        actor,
        detalle: prev.rows[0].titulo,
        respaldoJson: prev.rows[0],
      });
      return true;
    }
    return false;
  } catch {
    fallbackPines = fallbackPines.filter((p) => p.id !== id);
    return true;
  }
}

export async function apoyarPinDB(id: string): Promise<number> {
  try {
    await initDatabase();
    const res = await pool.query(
      'UPDATE pines_territoriales SET apoyos_vecinales = COALESCE(apoyos_vecinales, 0) + 1 WHERE id = $1 RETURNING apoyos_vecinales',
      [id]
    );
    return res.rows[0]?.apoyos_vecinales || 0;
  } catch {
    const p = fallbackPines.find((x) => x.id === id);
    if (p) {
      p.apoyosVecinales = (p.apoyosVecinales || 0) + 1;
      return p.apoyosVecinales;
    }
    return 0;
  }
}

export async function getReclamosDB(): Promise<ReclamoVecinal[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT * FROM reclamos_vecinales ORDER BY created_at DESC');
    return res.rows.map((r) => ({
      id: r.id,
      codigoSeguimiento: r.codigo_seguimiento,
      nombreVecino: r.nombre_vecino,
      apellidoVecino: r.apellido_vecino || undefined,
      dniVecino: r.dni_vecino || undefined,
      telefonoVecino: r.telefono_vecino,
      localidad: r.localidad,
      barrio: r.barrio || undefined,
      calle: r.calle,
      altura: r.altura || undefined,
      entreCalles: r.entre_calles || undefined,
      tipoReclamo: r.tipo_reclamo,
      subtipoReclamo: r.subtipo_reclamo || undefined,
      descripcion: r.descripcion,
      normaDigesto: r.norma_digesto || undefined,
      estado: r.estado,
      numeroReclamoMunicipal: r.numero_reclamo_municipal || undefined,
      patrocinadoPor: r.patrocinado_por || 'Juan Pedro Aquino · Jefe de Bloque Concejales LLA',
      fecha: r.fecha,
      lat: r.lat ? Number(r.lat) : undefined,
      lng: r.lng ? Number(r.lng) : undefined,
      createdAt: r.created_at ? r.created_at.toISOString() : undefined,
    }));
  } catch {
    return fallbackReclamos;
  }
}

export async function createReclamoDB(reclamo: ReclamoVecinal): Promise<ReclamoVecinal> {
  try {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO reclamos_vecinales (
        id, codigo_seguimiento, nombre_vecino, apellido_vecino, dni_vecino,
        telefono_vecino, localidad, barrio, calle, altura, entre_calles,
        tipo_reclamo, subtipo_reclamo, descripcion, norma_digesto, estado,
        numero_reclamo_municipal, patrocinado_por, fecha, lat, lng
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *`,
      [
        reclamo.id,
        reclamo.codigoSeguimiento,
        reclamo.nombreVecino,
        reclamo.apellidoVecino || null,
        reclamo.dniVecino || null,
        reclamo.telefonoVecino,
        reclamo.localidad,
        reclamo.barrio || null,
        reclamo.calle,
        reclamo.altura || null,
        reclamo.entreCalles || null,
        reclamo.tipoReclamo,
        reclamo.subtipoReclamo || null,
        reclamo.descripcion,
        reclamo.normaDigesto || null,
        reclamo.estado,
        reclamo.numeroReclamoMunicipal || null,
        reclamo.patrocinadoPor || 'Juan Pedro Aquino · Jefe de Bloque Concejales LLA',
        reclamo.fecha,
        reclamo.lat || null,
        reclamo.lng || null,
      ]
    );
    const r = res.rows[0];
    const created: ReclamoVecinal = {
      id: r.id,
      codigoSeguimiento: r.codigo_seguimiento,
      nombreVecino: r.nombre_vecino,
      apellidoVecino: r.apellido_vecino || undefined,
      dniVecino: r.dni_vecino || undefined,
      telefonoVecino: r.telefono_vecino,
      localidad: r.localidad,
      barrio: r.barrio || undefined,
      calle: r.calle,
      altura: r.altura || undefined,
      entreCalles: r.entre_calles || undefined,
      tipoReclamo: r.tipo_reclamo,
      subtipoReclamo: r.subtipo_reclamo || undefined,
      descripcion: r.descripcion,
      normaDigesto: r.norma_digesto || undefined,
      estado: r.estado,
      numeroReclamoMunicipal: r.numero_reclamo_municipal || undefined,
      patrocinadoPor: r.patrocinado_por,
      fecha: r.fecha,
      lat: r.lat ? Number(r.lat) : undefined,
      lng: r.lng ? Number(r.lng) : undefined,
      createdAt: r.created_at ? r.created_at.toISOString() : undefined,
    };
    fallbackReclamos.unshift(created);
    return created;
  } catch {
    fallbackReclamos.unshift(reclamo);
    return reclamo;
  }
}

export async function updateReclamoDB(
  id: string,
  updates: Partial<ReclamoVecinal>
): Promise<ReclamoVecinal | null> {
  try {
    await initDatabase();
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (updates.estado !== undefined) { fields.push(`estado = $${idx++}`); values.push(updates.estado); }
    if (updates.numeroReclamoMunicipal !== undefined) {
      fields.push(`numero_reclamo_municipal = $${idx++}`);
      values.push(updates.numeroReclamoMunicipal);
    }
    if (updates.normaDigesto !== undefined) { fields.push(`norma_digesto = $${idx++}`); values.push(updates.normaDigesto); }

    if (fields.length > 0) {
      values.push(id);
      const res = await pool.query(
        `UPDATE reclamos_vecinales SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
        values
      );
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          codigoSeguimiento: r.codigo_seguimiento,
          nombreVecino: r.nombre_vecino,
          apellidoVecino: r.apellido_vecino || undefined,
          dniVecino: r.dni_vecino || undefined,
          telefonoVecino: r.telefono_vecino,
          localidad: r.localidad,
          barrio: r.barrio || undefined,
          calle: r.calle,
          altura: r.altura || undefined,
          entreCalles: r.entre_calles || undefined,
          tipoReclamo: r.tipo_reclamo,
          subtipoReclamo: r.subtipo_reclamo || undefined,
          descripcion: r.descripcion,
          normaDigesto: r.norma_digesto || undefined,
          estado: r.estado,
          numeroReclamoMunicipal: r.numero_reclamo_municipal || undefined,
          patrocinadoPor: r.patrocinado_por,
          fecha: r.fecha,
          lat: r.lat ? Number(r.lat) : undefined,
          lng: r.lng ? Number(r.lng) : undefined,
        };
      }
    }
  } catch {
    // fallback
  }

  const idx = fallbackReclamos.findIndex((r) => r.id === id);
  if (idx !== -1) {
    fallbackReclamos[idx] = { ...fallbackReclamos[idx], ...updates };
    return fallbackReclamos[idx];
  }
  return null;
}
