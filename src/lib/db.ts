import { Pool } from 'pg';
import { ProyectoHCD, VisitaTerritorial } from '@/types';
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
          fecha VARCHAR(32) NOT NULL,
          autor VARCHAR(128) NOT NULL,
          localidad VARCHAR(128) NOT NULL,
          categoria VARCHAR(64) NOT NULL,
          estado VARCHAR(64) NOT NULL,
          resumen TEXT NOT NULL,
          destacado BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
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
      `);

      // 4. Seed initial proyectos if empty
      const projsCount = await client.query('SELECT COUNT(*) FROM proyectos');
      if (parseInt(projsCount.rows[0].count, 10) === 0) {
        for (const p of PROYECTOS_INICIALES) {
          await client.query(
            `INSERT INTO proyectos (id, titulo, expediente, fecha, autor, localidad, categoria, estado, resumen, destacado)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             ON CONFLICT (id) DO NOTHING`,
            [p.id, p.titulo, p.expediente || '', p.fecha, p.autor, p.localidad, p.categoria, p.estado, p.resumen, !!p.destacado]
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
export async function getProyectosDB(): Promise<ProyectoHCD[]> {
  try {
    await initDatabase();
    const res = await pool.query('SELECT * FROM proyectos ORDER BY created_at DESC');
    return res.rows.map(r => ({
      id: r.id,
      titulo: r.titulo,
      expediente: r.expediente,
      fecha: r.fecha,
      autor: r.autor,
      localidad: r.localidad,
      categoria: r.categoria,
      estado: r.estado,
      resumen: r.resumen,
      destacado: r.destacado
    }));
  } catch (err) {
    console.warn('Fallback to initial mock proyectos:', (err as Error).message);
    return PROYECTOS_INICIALES;
  }
}

export async function createProyectoDB(p: ProyectoHCD): Promise<ProyectoHCD> {
  await initDatabase();
  const res = await pool.query(
    `INSERT INTO proyectos (id, titulo, expediente, fecha, autor, localidad, categoria, estado, resumen, destacado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [p.id, p.titulo, p.expediente || '', p.fecha, p.autor, p.localidad, p.categoria, p.estado, p.resumen, !!p.destacado]
  );
  return res.rows[0];
}

export async function deleteProyectoDB(id: string): Promise<boolean> {
  await initDatabase();
  const res = await pool.query('DELETE FROM proyectos WHERE id = $1', [id]);
  return (res.rowCount || 0) > 0;
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

