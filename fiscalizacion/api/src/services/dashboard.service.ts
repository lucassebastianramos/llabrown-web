import prisma from '../lib/prisma.js';

export const getDashboardStats = async (allowedCircuitos?: string[]) => {
  if (!allowedCircuitos || allowedCircuitos.length === 0) {
    const totalEscuelas = await prisma.escuela.count();
    const escuelasConFG = await prisma.escuela.count({ where: { fgId: { not: null } } });
    const incidenciasAbiertas = await prisma.incidencia.count({ where: { estado: 'abierta' } });
    const totalFiscales = await prisma.user.count({ where: { OR: [{ role: 'fiscal_general' }, { role: 'fiscal_mesa' }] } });
  const fiscalesBackup = 0;
    const totalMesas = await prisma.mesa.count();
    const mesasCubiertas = await prisma.mesa.count({ where: { fiscalId: { not: null } } });

    const porcentajeCobertura = totalEscuelas > 0
      ? Math.round((escuelasConFG / totalEscuelas) * 100)
      : 0;
    const porcentajeMesasCubiertas = totalMesas > 0
      ? Math.round((mesasCubiertas / totalMesas) * 100)
      : 0;

    return {
      totalEscuelas,
      escuelasConFG,
      incidenciasAbiertas,
      totalFiscales,
      fiscalesBackup,
      porcentajeCobertura,
      totalMesas,
      mesasCubiertas,
      porcentajeMesasCubiertas,
    };
  }

  // Restricted by circuitos
  const [escuelas, incidenciasAbiertas, mesasAgg, fiscalesAgg] = await Promise.all([
    prisma.escuela.findMany({ where: { circuito: { in: allowedCircuitos } }, select: { id: true, fgId: true } }),
    prisma.incidencia.count({ where: { estado: 'abierta', escuela: { circuito: { in: allowedCircuitos } } } }),
    prisma.mesa.groupBy({
      by: ['escuelaId'],
      _count: { _all: true },
      where: { escuela: { circuito: { in: allowedCircuitos } } },
    }) as any,
    // Count distinct users for FG/FM with assignments within allowed circuitos
    (async () => {
      const totalFiscales = await prisma.user.count({ where: { OR: [{ role: 'fiscal_general' }, { role: 'fiscal_mesa' }], escuela: { circuito: { in: allowedCircuitos } } } });
      const fiscalesBackup = 0;
      return { totalFiscales, fiscalesBackup };
    })(),
  ]);

  const totalEscuelas = escuelas.length;
  const escuelasConFG = escuelas.filter(e => !!e.fgId).length;
  const totalMesas = mesasAgg.reduce((sum: number, r: any) => sum + (r._count?._all || 0), 0);
  const mesasCubiertas = await prisma.mesa.count({ where: { fiscalId: { not: null }, escuela: { circuito: { in: allowedCircuitos } } } });

  const porcentajeCobertura = totalEscuelas > 0 ? Math.round((escuelasConFG / totalEscuelas) * 100) : 0;
  const porcentajeMesasCubiertas = totalMesas > 0 ? Math.round((mesasCubiertas / totalMesas) * 100) : 0;

  return {
    totalEscuelas,
    escuelasConFG,
    incidenciasAbiertas,
    totalFiscales: fiscalesAgg.totalFiscales,
    fiscalesBackup: fiscalesAgg.fiscalesBackup,
    porcentajeCobertura,
    totalMesas,
    mesasCubiertas,
    porcentajeMesasCubiertas,
  };
};

export const getCircuitCoverage = async (allowedCircuitos?: string[]) => {
  const where: any = {};
  if (allowedCircuitos && allowedCircuitos.length) {
    where.circuito = { in: allowedCircuitos } as any;
  }
  const escuelas = await prisma.escuela.findMany({ where, include: { mesas: true } });
  const byCircuit: Record<string, { escuelas: number; conFG: number; mesas: number; mesasCubiertas: number }> = {};
  for (const e of escuelas) {
    const c = String(e.circuito || '');
    if (!byCircuit[c]) byCircuit[c] = { escuelas: 0, conFG: 0, mesas: 0, mesasCubiertas: 0 };
    byCircuit[c].escuelas += 1;
    if (e.fgId) byCircuit[c].conFG += 1;
    const totalMesas = e.mesas.length;
    const cubiertas = e.mesas.filter(m => !!m.fiscalId).length;
    byCircuit[c].mesas += totalMesas;
    byCircuit[c].mesasCubiertas += cubiertas;
  }
  const rows = Object.entries(byCircuit).map(([code, v]) => ({
    circuito: code,
    escuelas: v.escuelas,
    porcentajeFG: v.escuelas ? Math.round((v.conFG / v.escuelas) * 100) : 0,
    mesas: v.mesas,
    porcentajeMesas: v.mesas ? Math.round((v.mesasCubiertas / v.mesas) * 100) : 0,
  }));
  return rows;
};