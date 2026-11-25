import prisma from '../lib/prisma.js';
export const getDashboardStats = async () => {
    const totalEscuelas = await prisma.escuela.count();
    const escuelasConFG = await prisma.escuela.count({ where: { fgId: { not: null } } });
    const incidenciasAbiertas = await prisma.incidencia.count({ where: { estado: 'abierta' } });
    const totalFiscales = await prisma.user.count({ where: { OR: [{ role: 'fiscal_general' }, { role: 'fiscal_mesa' }] } });
    const fiscalesBackup = await prisma.user.count({ where: { AND: [{ OR: [{ role: 'fiscal_general' }, { role: 'fiscal_mesa' }] }, { escuelaId: null }] } });
    const porcentajeCobertura = totalEscuelas > 0
        ? Math.round((escuelasConFG / totalEscuelas) * 100)
        : 0;
    return {
        totalEscuelas,
        escuelasConFG,
        incidenciasAbiertas,
        totalFiscales,
        fiscalesBackup,
        porcentajeCobertura,
    };
};
//# sourceMappingURL=dashboard.service.js.map