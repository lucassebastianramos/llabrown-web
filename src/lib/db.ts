import { Pool } from 'pg';
import { ProyectoHCD, VisitaTerritorial, ReclamoVecinal } from '@/types';
import { PROYECTOS_INICIALES, VISITAS_INICIALES } from '@/data/mockData';

const connectionString = process.env.DATABASE_URL || 'postgresql://lla_user:lla_password@localhost:5432/llabrown';

// Global singleton pool for Next.js to prevent connection exhaustion in serverless/dev
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

/**
 * Initializes tables and seeds default data if tables are empty.
 */
export async function initDatabase() {
  if (isDbInitialized) return;

  try {
    const client = await pool.connect();
    try {
      // 1. Create table proyectos
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
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS archivo_pdf TEXT;
        ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS archivo_nombre TEXT;
      `);

      // 2. Create table visitas
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
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Create table pines_territoriales
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

        -- 4. Create table reclamos_vecinales
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
          patrocinado_por VARCHAR(128) NOT NULL DEFAULT 'Juan Pedro Aquino - Jefe de Bloque Concejales LLA',
          fecha VARCHAR(32) NOT NULL,
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 5. Seed initial proyectos if empty
      const projsCount = await client.query('SELECT COUNT(*) FROM proyectos');
      if (parseInt(projsCount.rows[0].count, 10) === 0) {
        for (const p of PROYECTOS_INICIALES) {
          await client.query(
            `INSERT INTO proyectos (id, titulo, expediente, archivo_pdf, archivo_nombre, fecha, autor, localidad, categoria, estado, resumen, destacado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO NOTHING`,
            [p.id, p.titulo, p.expediente || '', p.archivoPdf || '', p.archivoNombre || '', p.fecha, p.autor, p.localidad, p.categoria, p.estado, p.resumen, !!p.destacado]
          );
        }
      }

      // 5. Seed initial visitas if empty
      const visitasCount = await client.query('SELECT COUNT(*) FROM visitas');
      if (parseInt(visitasCount.rows[0].count, 10) === 0) {
        for (const v of VISITAS_INICIALES) {
          await client.query(
            `INSERT INTO visitas (id, titulo, localidad, circuito, fecha, descripcion, fotos, concejales, temas_tratados)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO NOTHING`,
            [v.id, v.titulo, v.localidad, v.circuito || '', v.fecha, v.descripcion, v.fotos, v.concejales, v.temasTratados]
          );
        }
      }

      // 6. Seed initial pines if empty
      const pinesCount = await client.query('SELECT COUNT(*) FROM pines_territoriales');
      if (parseInt(pinesCount.rows[0].count, 10) === 0) {
        const { PINES_INICIALES } = await import('@/data/mockData');
        for (const pin of PINES_INICIALES) {
          await client.query(
            `INSERT INTO pines_territoriales (id, titulo, calle, localidad, lat, lng, categoria, estado, descripcion, concejal, fotos, pdf_url, pdf_nombre, fecha, apoyos_vecinales)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
             ON CONFLICT (id) DO NOTHING`,
            [pin.id, pin.titulo, pin.calle, pin.localidad, pin.lat, pin.lng, pin.categoria, pin.estado, pin.descripcion, pin.concejal, pin.fotos, pin.pdfUrl || null, pin.pdfNombre || null, pin.fecha, pin.apoyosVecinales || 0]
          );
        }
      }

      isDbInitialized = true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn('PostgreSQL not reachable or initialization deferred:', (error as Error).message);
  }
}

// Data access helpers
let fallbackProyectosCache: ProyectoHCD[] = [...PROYECTOS_INICIALES];

export async function getProyectosDB(): Promise<ProyectoHCD[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT * FROM proyectos ORDER BY created_at DESC');
    return res.rows.map(r => ({
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
      destacado: r.destacado
    }));
  } catch (err) {
    console.warn('Fallback to in-memory proyectos cache:', (err as Error).message);
    return fallbackProyectosCache;
  }
}

export async function createProyectoDB(p: ProyectoHCD): Promise<ProyectoHCD> {
  try {
    await initDatabase();
    const res = await pool.query(
      `INSERT INTO proyectos (id, titulo, expediente, archivo_pdf, archivo_nombre, fecha, autor, localidad, categoria, estado, resumen, destacado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [p.id, p.titulo, p.expediente || '', p.archivoPdf || null, p.archivoNombre || null, p.fecha, p.autor, p.localidad, p.categoria, p.estado, p.resumen, !!p.destacado]
    );
    const r = res.rows[0];
    const created: ProyectoHCD = {
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
      destacado: r.destacado
    };
    fallbackProyectosCache.unshift(created);
    return created;
  } catch (err) {
    console.warn('Saving proyecto to fallback cache:', (err as Error).message);
    fallbackProyectosCache.unshift(p);
    return p;
  }
}

export async function deleteProyectoDB(id: string): Promise<boolean> {
  fallbackProyectosCache = fallbackProyectosCache.filter(p => p.id !== id);
  try {
    await initDatabase();
    const res = await pool.query('DELETE FROM proyectos WHERE id = $1', [id]);
    return (res.rowCount || 0) > 0;
  } catch (err) {
    return true;
  }
}

export async function getVisitasDB(): Promise<VisitaTerritorial[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT * FROM visitas ORDER BY created_at DESC');
    return res.rows.map(r => ({
      id: r.id,
      titulo: r.titulo,
      localidad: r.localidad,
      circuito: r.circuito,
      fecha: r.fecha,
      descripcion: r.descripcion,
      fotos: r.fotos || [],
      concejales: r.concejales || [],
      temasTratados: r.temas_tratados || []
    }));
  } catch (err) {
    console.warn('Fallback to initial mock visitas:', (err as Error).message);
    return VISITAS_INICIALES;
  }
}

export async function createVisitaDB(v: VisitaTerritorial): Promise<VisitaTerritorial> {
  await initDatabase();
  const res = await pool.query(
    `INSERT INTO visitas (id, titulo, localidad, circuito, fecha, descripcion, fotos, concejales, temas_tratados)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [v.id, v.titulo, v.localidad, v.circuito || '', v.fecha, v.descripcion, v.fotos, v.concejales, v.temasTratados]
  );
  return res.rows[0];
}

export async function deleteVisitaDB(id: string): Promise<boolean> {
  await initDatabase();
  const res = await pool.query('DELETE FROM visitas WHERE id = $1', [id]);
  return (res.rowCount || 0) > 0;
}

export async function getPinesDB(): Promise<import('@/types').PinTerritorial[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT * FROM pines_territoriales ORDER BY created_at DESC');
    return res.rows.map(r => ({
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
      apoyosVecinales: r.apoyos_vecinales || 0
    }));
  } catch (err) {
    console.warn('Fallback to initial mock pines:', (err as Error).message);
    const { PINES_INICIALES } = await import('@/data/mockData');
    return PINES_INICIALES;
  }
}

export async function createPinDB(pin: import('@/types').PinTerritorial): Promise<import('@/types').PinTerritorial> {
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
      pin.apoyosVecinales || 0
    ]
  );
  return {
    ...res.rows[0],
    barrio: res.rows[0].barrio || undefined
  };
}

export async function deletePinDB(id: string): Promise<boolean> {
  await initDatabase();
  const res = await pool.query('DELETE FROM pines_territoriales WHERE id = $1', [id]);
  return (res.rowCount || 0) > 0;
}

export async function apoyarPinDB(id: string): Promise<number> {
  await initDatabase();
  const res = await pool.query(
    'UPDATE pines_territoriales SET apoyos_vecinales = COALESCE(apoyos_vecinales, 0) + 1 WHERE id = $1 RETURNING apoyos_vecinales',
    [id]
  );
  return res.rows[0]?.apoyos_vecinales || 0;
}

// Fallback in-memory cache for reclamos when PostgreSQL is not running
let fallbackReclamosCache: ReclamoVecinal[] = [];

export async function getReclamosDB(): Promise<ReclamoVecinal[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT * FROM reclamos_vecinales ORDER BY created_at DESC');
    return res.rows.map(r => ({
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
      patrocinadoPor: r.patrocinado_por || 'Juan Pedro Aquino - Jefe de Bloque Concejales LLA',
      fecha: r.fecha,
      lat: r.lat ? Number(r.lat) : undefined,
      lng: r.lng ? Number(r.lng) : undefined,
      createdAt: r.created_at ? r.created_at.toISOString() : undefined,
    }));
  } catch (err) {
    console.warn('Fallback to in-memory reclamos cache:', (err as Error).message);
    return fallbackReclamosCache;
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
        reclamo.patrocinadoPor || 'Juan Pedro Aquino - Jefe de Bloque Concejales LLA',
        reclamo.fecha,
        reclamo.lat || null,
        reclamo.lng || null
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
    fallbackReclamosCache.unshift(created);
    return created;
  } catch (err) {
    console.warn('Saving reclamo to fallback memory cache:', (err as Error).message);
    fallbackReclamosCache.unshift(reclamo);
    return reclamo;
  }
}

export async function updateReclamoDB(id: string, updates: Partial<ReclamoVecinal>): Promise<ReclamoVecinal | null> {
  try {
    await initDatabase();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (updates.estado !== undefined) {
      fields.push(`estado = $${idx++}`);
      values.push(updates.estado);
    }
    if (updates.numeroReclamoMunicipal !== undefined) {
      fields.push(`numero_reclamo_municipal = $${idx++}`);
      values.push(updates.numeroReclamoMunicipal);
    }
    if (updates.normaDigesto !== undefined) {
      fields.push(`norma_digesto = $${idx++}`);
      values.push(updates.normaDigesto);
    }

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
  } catch (err) {
    console.warn('Updating fallback reclamos cache:', (err as Error).message);
  }

  const idx = fallbackReclamosCache.findIndex(r => r.id === id);
  if (idx !== -1) {
    fallbackReclamosCache[idx] = { ...fallbackReclamosCache[idx], ...updates };
    return fallbackReclamosCache[idx];
  }
  return null;
}


