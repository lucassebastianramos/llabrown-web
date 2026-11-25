import { Request, Response } from 'express';
import * as dashboardService from '../services/dashboard.service.js';
import { getAuthUser } from '../lib/auth.js';
import * as authService from '../services/auth.service.js';
import prisma from '../lib/prisma.js';

export const getDashboardData = async (req: Request, res: Response) => {
  try {
    let allowedCircuitos: string[] | undefined = undefined;
    const auth = getAuthUser(req);
    if (auth?.userId) {
      const me = await authService.getMe(auth.userId);
      if (me) {
        if (me.role === 'encargado_seccion' && Array.isArray(me.circuitos) && me.circuitos.length) {
          allowedCircuitos = me.circuitos;
        } else if (me.role === 'fiscal_general') {
          // limit to FG escuelas circuitos
          allowedCircuitos = me.circuitos || [];
        } else if (me.role === 'fiscal_mesa') {
          // find mesa -> escuela circuito
          const mesa = await prisma.mesa.findFirst({ where: { fiscalId: auth.userId }, include: { escuela: true } });
          if (mesa?.escuela?.circuito) allowedCircuitos = [String(mesa.escuela.circuito)];
        }
      }
    }

    if (req.query.by === 'circuit') {
      const rows = await dashboardService.getCircuitCoverage(allowedCircuitos);
      return res.json(rows);
    }
    const stats = await dashboardService.getDashboardStats(allowedCircuitos);
    res.json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};