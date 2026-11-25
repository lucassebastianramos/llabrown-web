import prisma from '../lib/prisma.js';

export type BackupEntity = 'users' | 'escuelas' | 'mesas' | 'asignaciones' | 'incidencias';

export const getSnapshot = async (opts?: { from?: Date; to?: Date }) => {
  const whereByDate = (hasCreatedAt: boolean) => hasCreatedAt && opts?.from && opts?.to
    ? { createdAt: { gte: opts.from, lte: opts.to } } : {};

  const [users, escuelas, mesas, incidencias] = await Promise.all([
    prisma.user.findMany({
      where: whereByDate(true) as any,
    }),
    prisma.escuela.findMany({
      include: { mesas: true, incidencias: true, fg: true },
    }),
    prisma.mesa.findMany({}),
    prisma.incidencia.findMany({ where: whereByDate(true) as any }),
  ]);
  return { users, escuelas, mesas, incidencias, exportedAt: new Date().toISOString(), from: opts?.from?.toISOString() ?? null, to: opts?.to?.toISOString() ?? null };
};

function toCSV(rows: any[]): string {
  if (!rows || rows.length === 0) return '';
  const headers = Array.from(
    rows.reduce((set: Set<string>, r: any) => {
      Object.keys(r).forEach((k) => set.add(k));
      return set;
    }, new Set<string>())
  );
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
    const needsQuotes = /[",\n]/.test(s);
    const escaped = s.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };
  const headerLine = headers.join(',');
  const lines = rows.map((r) => headers.map((h) => escape(r[h])).join(','));
  return [headerLine, ...lines].join('\n');
}

export const getEntityCSV = async (entity: BackupEntity, opts?: { from?: Date; to?: Date; fields?: string[] }): Promise<{ filename: string; csv: string }> => {
  const range = (hasCreatedAt: boolean) => hasCreatedAt && opts?.from && opts?.to ? { createdAt: { gte: opts.from, lte: opts.to } } : {};
  const project = (rows: any[]) => {
    if (!opts?.fields || opts.fields.length === 0) return rows;
    const allowed = new Set(opts.fields);
    return rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => allowed.has(k))));
  };
  switch (entity) {
    case 'users': {
      const rows = await prisma.user.findMany({ where: range(true) as any });
      return { filename: 'users.csv', csv: toCSV(project(rows)) };
    }
    case 'escuelas': {
      const rows = await prisma.escuela.findMany({});
      return { filename: 'escuelas.csv', csv: toCSV(project(rows)) };
    }
    case 'mesas': {
      const rows = await prisma.mesa.findMany({});
      return { filename: 'mesas.csv', csv: toCSV(project(rows)) };
    }
    case 'asignaciones': {
      return { filename: 'asignaciones.csv', csv: '' };
    }
    case 'incidencias': {
      const rows = await prisma.incidencia.findMany({ where: range(true) as any });
      return { filename: 'incidencias.csv', csv: toCSV(project(rows)) };
    }
    default:
      throw new Error('Entidad no soportada');
  }
};
