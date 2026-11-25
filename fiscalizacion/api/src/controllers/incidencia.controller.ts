import { Request, Response } from 'express';
import * as incidenciaService from '../services/incidencia.service.js';
import { getAuthUser } from '../lib/auth.js';
import * as authService from '../services/auth.service.js';

export const getIncidencias = async (req: Request, res: Response) => {
  try {
    const { tipo, estado, escuelaId, page, pageSize } = req.query as any;

    let allowedCircuitos: string[] | undefined = undefined;
    const auth = getAuthUser(req);
    if (auth?.userId) {
      const me = await authService.getMe(auth.userId);
      if (me && me.role === 'encargado_seccion' && Array.isArray(me.circuitos) && me.circuitos.length) {
        allowedCircuitos = me.circuitos;
      }
    }

    const result = await incidenciaService.getIncidencias({
      tipo,
      estado,
      escuelaId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      allowedCircuitos,
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createIncidencia = async (req: Request, res: Response) => {
  try {
    const newIncidencia = await incidenciaService.createIncidencia(req.body);
    res.status(201).json(newIncidencia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateIncidencia = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });
    const updatedIncidencia = await incidenciaService.updateIncidencia(id, req.body);
    res.json(updatedIncidencia);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteIncidencia = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    if (!id) return res.status(400).json({ error: 'Parámetro id requerido' });
    await incidenciaService.deleteIncidencia(id);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};