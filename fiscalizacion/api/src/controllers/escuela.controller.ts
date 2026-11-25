import { Request, Response } from 'express';
import * as escuelaService from '../services/escuela.service.js';
import { getAuthUser } from '../lib/auth.js';
import * as authService from '../services/auth.service.js';
import prisma from '../lib/prisma.js';

export const getEscuelas = async (req: Request, res: Response) => {
  const { seccion, search } = req.query as any;
  try {
    let allowedCircuitos: string[] | undefined = undefined;
    let allowedEscuelaIds: string[] | undefined = undefined;
    const auth = getAuthUser(req);
    if (auth?.userId) {
      const me = await authService.getMe(auth.userId);
      if (me) {
        if (me.role === 'encargado_seccion' && Array.isArray(me.circuitos) && me.circuitos.length) {
          allowedCircuitos = me.circuitos;
        } else if (me.role === 'fiscal_general') {
          // limit FG to assigned escuelas
          const asign = await (prisma as any).asignacion.findMany({ where: { userId: auth.userId, role: 'fiscal_general' }, select: { escuelaId: true } });
          allowedEscuelaIds = asign.map((a: any) => a.escuelaId).filter(Boolean);
        } else if (me.role === 'fiscal_mesa') {
          // hide from FM
          return res.json([]);
        }
      }
    }
    const escuelas = await escuelaService.getAllEscuelas(seccion as string, search as string, allowedCircuitos, allowedEscuelaIds);
    // Remapear el resultado para que coincida con la estructura esperada, incluyendo mesas
    const result = escuelas.map((e: any) => ({
      id: e.id,
      nombre: e.nombre,
      domicilio: e.domicilio,
      circuito: e.circuito,
      seccion: e.seccion,
      lat: e.lat ?? null,
      lng: e.lng ?? null,
      fg_id: e.fgId,
      fg_nombre: (e as any).fg?.nombre,
      fg_apellido: (e as any).fg?.apellido,
      fg_celular: (e as any).fg?.celular,
      incidencias_count: e.incidencias ? e.incidencias.length : (e._count?.incidencias ?? 0),
      mesas: Array.isArray(e.mesas)
        ? e.mesas.map((m: any) => ({ id: m.id, nro: m.nro, fiscalId: m.fiscalId ?? null }))
        : [],
    }));
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEscuela = async (req: Request, res: Response) => {
  try {
    // Only coordinador/encargado can create
    const auth = getAuthUser(req);
    if (!auth?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const me = await authService.getMe(auth.userId);
    if (!me || (me.role !== 'coordinador' && me.role !== 'encargado_seccion')) return res.status(403).json({ error: 'Forbidden' });
    // Convert seccion to number
    const data = { ...req.body, seccion: Number(req.body.seccion) };
    const newEscuela = await escuelaService.createEscuela(data);
    res.status(201).json(newEscuela);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEscuela = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  try {
    if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });
    const auth = getAuthUser(req);
    if (!auth?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const me = await authService.getMe(auth.userId);
    if (!me || (me.role !== 'coordinador' && me.role !== 'encargado_seccion')) return res.status(403).json({ error: 'Forbidden' });

    const parseNumOrNull = (v: any) => (v === undefined ? undefined : (v === null || v === '' ? null : Number(v)));
    const data = {
      ...req.body,
      seccion: Number(req.body.seccion),
      lat: parseNumOrNull(req.body.lat),
      lng: parseNumOrNull(req.body.lng),
    };
    const updatedEscuela = await escuelaService.updateEscuela(id, data);
    res.json(updatedEscuela);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const geocodeMissing = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const me = await authService.getMe(auth.userId);
    if (!me || (me.role !== 'coordinador' && me.role !== 'encargado_seccion')) return res.status(403).json({ error: 'Forbidden' });

    console.log('[escuelas] Geocode missing requested');
    const result = await escuelaService.geocodeMissingEscuelas();
    console.log(`[escuelas] Geocode missing result:`, result);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEscuela = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  try {
    if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });
    const auth = getAuthUser(req);
    if (!auth?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const me = await authService.getMe(auth.userId);
    if (!me || (me.role !== 'coordinador' && me.role !== 'encargado_seccion')) return res.status(403).json({ error: 'Forbidden' });

    await escuelaService.deleteEscuela(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const downloadTemplate = async (req: Request, res: Response) => {
  try {
    const { circuitos } = req.query as any;
    const filterCodes = typeof circuitos === 'string' && circuitos.length ? circuitos.split(',').map((s: string) => s.trim()) : undefined;

    let allowedCircuitos: string[] | undefined = undefined;
    const auth = getAuthUser(req);
    if (auth?.userId) {
      const me = await authService.getMe(auth.userId);
      if (me && me.role === 'encargado_seccion' && Array.isArray(me.circuitos) && me.circuitos.length) {
        allowedCircuitos = me.circuitos;
      }
    }

    const escuelas = await escuelaService.getAllEscuelas(undefined as any, undefined as any, allowedCircuitos);
    const selected = filterCodes && filterCodes.length
      ? escuelas.filter((e: any) => filterCodes.includes(String(e.circuito)))
      : escuelas;
    const headers = [
      'DISTRITO',
      'SECCION',
      'ESTABLECIMIENTO',
      'DOMICILIO',
      'CIRCUITO ELECTORAL',
      'CARGO',
      'DNI',
      'APELLIDO',
      'NOMBRE',
      'NRO CELULAR',
      'REFERENTE A CARGO',
    ];
    const toLine = (arr: string[]) => arr.map((v) => {
      const s = v ?? '';
      const needs = /[",\n]/.test(s);
      const esc = s.replace(/"/g, '""');
      return needs ? `"${esc}"` : s;
    }).join(',');

    const lines = [toLine(headers)];
    for (const e of selected) {
      lines.push(toLine([
        'ALMIRANTE BROWN',
        String(e.seccion ?? ''),
        e.nombre ?? '',
        e.domicilio ?? '',
        String(e.circuito ?? ''),
        '', // CARGO
        '', // DNI
        '', // APELLIDO
        '', // NOMBRE
        '', // NRO CELULAR
        '', // REFERENTE A CARGO
      ]));
    }
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_escuelas_fiscales.csv"');
    res.send(csv);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEscuelaById = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  try {
    if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });
    const e = await escuelaService.getEscuelaById(id);
    if (!e) return res.status(404).json({ error: 'Escuela no encontrada' });
    const result = {
      id: e.id,
      nombre: e.nombre,
      domicilio: e.domicilio,
      circuito: e.circuito,
      seccion: e.seccion,
      lat: (e as any).lat ?? null,
      lng: (e as any).lng ?? null,
      fg_id: (e as any).fgId ?? null,
      fg: (e as any).fg || null,
      incidencias_count: e.incidencias ? e.incidencias.length : (e as any)._count?.incidencias ?? 0,
      mesas: Array.isArray((e as any).mesas)
        ? (e as any).mesas.map((m: any) => ({ id: m.id, nro: m.nro, fiscalId: m.fiscalId ?? null, fiscal: m.fiscal || null }))
        : [],
    };
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};