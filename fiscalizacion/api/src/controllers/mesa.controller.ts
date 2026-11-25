import { Request, Response } from 'express';
import * as mesaService from '../services/mesa.service.js';
import { getAuthUser } from '../lib/auth.js';

export const updateMesaFiscal = async (req: Request, res: Response) => {
  const id = String(req.params.id || '');
  const { fiscalId } = req.body as { fiscalId: string | null };
  try {
    if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });
    const updated = await mesaService.updateMesaFiscal(id, fiscalId ?? null);
    res.json(updated);
  } catch (error: any) {
    console.error(error);
    const msg = typeof error?.message === 'string' ? error.message : 'Internal server error';
    if (msg.includes('no encontrada') || msg.includes('no encontrado')) return res.status(404).json({ error: msg });
    if (msg.includes('misma escuela')) return res.status(400).json({ error: msg });
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Guard: ensure current user is the assigned fiscal_mesa of mesaId
async function requireFiscalMesa(req: Request, res: Response): Promise<{ userId: string; mesaId: string } | null> {
  const { id: mesaId } = req.params as any;
  const auth = getAuthUser(req);
  if (!auth?.userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }
  if (mesaId === 'me') {
    // resolve mesa by user assignment
    const mine = await mesaService.getMiMesa(auth.userId);
    if (!mine?.mesa?.id) {
      res.status(404).json({ error: 'Mesa no encontrada para el usuario' });
      return null;
    }
    return { userId: auth.userId, mesaId: mine.mesa.id };
  }
  try {
    const allowed = await mesaService.verifyFiscalMesaAccess(mesaId, auth.userId);
    if (!allowed) {
      res.status(403).json({ error: 'Forbidden' });
      return null;
    }
    return { userId: auth.userId, mesaId };
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
    return null;
  }
}

export const getMesaJornada = async (req: Request, res: Response) => {
  const ctx = await requireFiscalMesa(req, res);
  if (!ctx) return;
  const data = await mesaService.getMesaJornada(ctx.mesaId);
  res.json(data);
};

export const openMesaJornada = async (req: Request, res: Response) => {
  const ctx = await requireFiscalMesa(req, res);
  if (!ctx) return;
  try {
    const now = new Date();
    // Allow open only on election day after 07:00 local, but permit override via env for testing
    const restrict = process.env.ENFORCE_ELECTION_WINDOW !== '0';
    if (restrict) {
      const h = now.getHours();
      if (h < 7) return res.status(400).json({ error: 'La jornada se habilita a las 07:00' });
    }
    const data = await mesaService.openMesaJornada(ctx.mesaId);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setMesaElectores = async (req: Request, res: Response) => {
  const ctx = await requireFiscalMesa(req, res);
  if (!ctx) return;
  try {
    const { electores } = req.body as { electores: number };
    if (!Number.isInteger(electores) || electores <= 0) return res.status(400).json({ error: 'electores inválido' });
    const data = await mesaService.setMesaElectores(ctx.mesaId, electores);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkinVotante = async (req: Request, res: Response) => {
  const ctx = await requireFiscalMesa(req, res);
  if (!ctx) return;
  try {
    const { numero } = req.body as { numero: number };
    if (!Number.isInteger(numero) || numero <= 0) return res.status(400).json({ error: 'número inválido' });
    const data = await mesaService.checkinVotante(ctx.mesaId, numero);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uncheckVotante = async (req: Request, res: Response) => {
  const ctx = await requireFiscalMesa(req, res);
  if (!ctx) return;
  try {
    const { numero } = req.body as { numero: number };
    if (!Number.isInteger(numero) || numero <= 0) return res.status(400).json({ error: 'número inválido' });
    const data = await mesaService.uncheckVotante(ctx.mesaId, numero);
    res.json(data);
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.includes('Jornada') || msg.includes('no está abierta')) return res.status(400).json({ error: msg });
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const closeMesaJornada = async (req: Request, res: Response) => {
  const ctx = await requireFiscalMesa(req, res);
  if (!ctx) return;
  try {
    const now = new Date();
    const restrict = process.env.ENFORCE_ELECTION_WINDOW !== '0';
    if (restrict) {
      const h = now.getHours();
      if (h < 18) return res.status(400).json({ error: 'El cierre se habilita a las 18:00' });
    }
    const data = await mesaService.closeMesaJornada(ctx.mesaId);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const submitResultados = async (req: Request, res: Response) => {
  const ctx = await requireFiscalMesa(req, res);
  if (!ctx) return;
  try {
    const { resultados } = req.body as { resultados: Record<string, number> };
    if (!resultados || typeof resultados !== 'object') return res.status(400).json({ error: 'resultados requeridos' });
    const data = await mesaService.submitResultados(ctx.mesaId, resultados);
    res.json(data);
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.includes('electores') || msg.includes('excede')) return res.status(400).json({ error: msg });
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadActa = async (req: Request, res: Response) => {
  const ctx = await requireFiscalMesa(req, res);
  if (!ctx) return;
  try {
    const data = await mesaService.handleUploadActa(req, ctx.mesaId);
    res.json(data);
  } catch (e: any) {
    const msg = String(e?.message || '');
    if (msg.includes('file')) return res.status(400).json({ error: msg });
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAlianzas = async (_req: Request, res: Response) => {
  try {
    const rows = await mesaService.getAlianzas();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};
