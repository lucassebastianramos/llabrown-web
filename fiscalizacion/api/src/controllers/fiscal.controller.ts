import { Request, Response } from 'express';
import * as fiscalService from '../services/fiscal.service.js';
import { getAuthUser } from '../lib/auth.js';
import * as authService from '../services/auth.service.js';

export const getFiscales = async (req: Request, res: Response) => {
  try {
    const role = (req.query.role as any) as 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa' | undefined;
    let allowedCircuitos: string[] | undefined = undefined;
    const auth = getAuthUser(req);
    if (auth?.userId) {
      const me = await authService.getMe(auth.userId);
      if (me && me.role === 'encargado_seccion' && Array.isArray(me.circuitos) && me.circuitos.length) {
        allowedCircuitos = me.circuitos;
      }
    }
    const result = await fiscalService.getAllFiscales(role, allowedCircuitos);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getFiscalesBackup = async (req: Request, res: Response) => {
  try {
    const result = await fiscalService.getBackupFiscales();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createFiscal = async (req: Request, res: Response) => {
  try {
    const newFiscal = await fiscalService.createFiscal(req.body);
    res.status(201).json(newFiscal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateFiscal = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });
    const updatedFiscal = await fiscalService.updateFiscal(id, req.body);
    res.json(updatedFiscal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteFiscal = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });
    await fiscalService.deleteFiscal(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserAsignaciones = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  try {
    const asign = await fiscalService.getAsignaciones(id);
    res.json(asign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const setUserAsignaciones = async (req: Request, res: Response) => {
  const { id } = req.params as any;
  const { role, escuelaIds } = req.body as { role: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa'; escuelaIds: string[] };
  try {
    if (!role || !Array.isArray(escuelaIds)) return res.status(400).json({ error: 'role y escuelaIds requeridos' });
    const asign = await fiscalService.setAsignaciones(id, role as any, escuelaIds);
    res.json(asign);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};