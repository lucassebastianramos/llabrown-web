import prisma from '../lib/prisma.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Request } from 'express';

export const updateMesaFiscal = async (id: string, fiscalId: string | null) => {
  const mesa = await prisma.mesa.findUnique({ where: { id }, select: { id: true, escuelaId: true } });
  if (!mesa) {
    throw new Error('Mesa no encontrada');
  }

  if (fiscalId) {
    // Ensure fiscal exists and belongs to the same school
    const fiscal = await prisma.user.findUnique({ where: { id: fiscalId }, select: { id: true, escuelaId: true } });
    if (!fiscal) throw new Error('Fiscal no encontrado');
    if (fiscal.escuelaId !== mesa.escuelaId) throw new Error('El fiscal no pertenece a la misma escuela');
  }

  return prisma.mesa.update({ where: { id }, data: { fiscalId: fiscalId ?? null } });
};

export const verifyFiscalMesaAccess = async (mesaId: string, userId: string) => {
  const mesa = await prisma.mesa.findUnique({ where: { id: mesaId }, select: { id: true, fiscalId: true } });
  return !!(mesa && mesa.fiscalId === userId);
};

export const getMiMesa = async (userId: string) => {
  const mesa = await prisma.mesa.findFirst({ where: { fiscalId: userId }, include: { escuela: true } });
  if (!mesa) return null;
  const jornada = await (prisma as any).mesaJornada.findUnique({ where: { mesaId: mesa.id } }).catch(() => null as any);
  const resultados = await (prisma as any).mesaResultados.findUnique({ where: { mesaId: mesa.id } }).catch(() => null as any);
  const actas = await (prisma as any).mesaActa.findMany({ where: { mesaId: mesa.id }, orderBy: { uploadedAt: 'desc' } }).catch(() => [] as any);
  return { mesa, jornada, resultados, actas } as any;
};

export const getMesaJornada = async (mesaId: string) => {
  const mesa = await prisma.mesa.findUnique({ where: { id: mesaId }, include: { escuela: true } });
  if (!mesa) throw new Error('Mesa no encontrada');
  const jornada = await (prisma as any).mesaJornada.findUnique({ where: { mesaId } });
  const resultados = await (prisma as any).mesaResultados.findUnique({ where: { mesaId } }).catch(() => null as any);
  const actas = await (prisma as any).mesaActa.findMany({ where: { mesaId }, orderBy: { uploadedAt: 'desc' } }).catch(() => [] as any);
  const votantesCount = jornada?.votantes?.length || 0;
  const faltantes = typeof jornada?.electores === 'number' ? Math.max(0, jornada!.electores! - votantesCount) : null;
  return { mesa: { id: mesa.id, nro: mesa.nro, escuela: { id: mesa.escuelaId, nombre: mesa.escuela.nombre } }, jornada: jornada || null, votantesCount, faltantes, resultados, actas };
};

export const openMesaJornada = async (mesaId: string) => {
  const now = new Date();
  const jornada = await (prisma as any).mesaJornada.upsert({
    where: { mesaId },
    create: { mesaId, status: 'abierta', openedAt: now, votantes: [] },
    update: { status: 'abierta', openedAt: now },
  });
  return jornada;
};

export const setMesaElectores = async (mesaId: string, electores: number) => {
  const jornada = await (prisma as any).mesaJornada.upsert({
    where: { mesaId },
    create: { mesaId, status: 'abierta', openedAt: new Date(), electores, votantes: [] },
    update: { electores },
  });
  return jornada;
};

export const checkinVotante = async (mesaId: string, numero: number) => {
  return (prisma as any).$transaction(async (tx: any) => {
    const j = await tx.mesaJornada.findUnique({ where: { mesaId } });
    if (!j) throw new Error('Jornada no iniciada');
    if (j.status !== 'abierta') throw new Error('La jornada no está abierta');
    if (typeof j.electores === 'number' && (numero < 1 || numero > j.electores)) {
      throw new Error('Número fuera de rango');
    }
    const set = new Set<number>(j.votantes as any);
    set.add(numero);
    const updated = await tx.mesaJornada.update({ where: { mesaId }, data: { votantes: { set: Array.from(set).sort((a, b) => a - b) } } });
    return updated;
  });
};

export const uncheckVotante = async (mesaId: string, numero: number) => {
  return (prisma as any).$transaction(async (tx: any) => {
    const j = await tx.mesaJornada.findUnique({ where: { mesaId } });
    if (!j) throw new Error('Jornada no iniciada');
    if (j.status !== 'abierta') throw new Error('La jornada no está abierta');
    const set = new Set<number>(j.votantes as any);
    set.delete(numero);
    const updated = await tx.mesaJornada.update({ where: { mesaId }, data: { votantes: { set: Array.from(set).sort((a, b) => a - b) } } });
    return updated;
  });
};

export const closeMesaJornada = async (mesaId: string) => {
  const now = new Date();
  const jornada = await (prisma as any).mesaJornada.update({ where: { mesaId }, data: { status: 'cerrada', closedAt: now } });
  return jornada;
};

export const submitResultados = async (mesaId: string, resultados: Record<string, number>) => {
  const clean: Record<string, number> = {};
  for (const [k, v] of Object.entries(resultados)) {
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) clean[k] = Math.floor(n);
  }
  // Validate against electores
  const j = await (prisma as any).mesaJornada.findUnique({ where: { mesaId } });
  if (!j || typeof j.electores !== 'number' || j.electores <= 0) {
    throw new Error('Debe cargar electores antes de resultados');
  }
  const total = Object.values(clean).reduce((a, b) => a + b, 0);
  if (total > j.electores) {
    throw new Error('La suma de votos excede los electores de la mesa');
  }
  const saved = await (prisma as any).mesaResultados.upsert({
    where: { mesaId },
    create: { mesaId, resultados: clean as any },
    update: { resultados: clean as any },
  });
  return saved;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) return cb(new Error('file tipo no permitido'));
    cb(null, true);
  },
}).single('file');

export const handleUploadActa = async (req: Request, mesaId: string) => {
  const file = await new Promise<Express.Multer.File>((resolve, reject) => {
    upload(req as any, {} as any, (err: any) => {
      if (err) return reject(err);
      const f = (req as any).file as Express.Multer.File | undefined;
      if (!f) return reject(new Error('file requerido'));
      resolve(f);
    });
  });

  const uploadsRoot = path.resolve(process.cwd(), 'api', 'uploads', 'actas', mesaId);
  await fs.promises.mkdir(uploadsRoot, { recursive: true });
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '_');
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rel = path.join('uploads', 'actas', mesaId, `${ts}-${safeName}`);
  const abs = path.resolve(process.cwd(), 'api', rel);
  await fs.promises.writeFile(abs, file.buffer);

  const rec = await (prisma as any).mesaActa.create({
    data: {
      mesaId,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: '/' + rel.replace(/\\/g, '/'),
    },
  });
  return rec;
};

export const getAlianzas = async () => {
  const rows = await (prisma as any).alianza.findMany({ where: { activo: true }, orderBy: { orden: 'asc' } });
  return rows.map((r: any) => ({ id: r.id, nombre: r.nombre }));
};
