import prisma from '../lib/prisma.js';

async function main() {
  const candidates = await prisma.user.findMany({
    where: {
      role: 'fiscal_mesa',
      OR: [
        { nombre: { in: ['N/A', 'Sin Nombre'] } },
        { apellido: { in: ['N/A', 'Sin Apellido'] } },
        { email: { startsWith: 'n.a.n.a', endsWith: '@example.com' } },
        { AND: [ { dni: null }, { celular: null }, { email: { endsWith: '@example.com' } } ] },
      ],
    },
    select: { id: true },
  });

  let detachedMesas = 0;
  let deletedAsignaciones = 0;
  let clearedFgs = 0;
  let deletedUsers = 0;

  for (const u of candidates) {
    await prisma.$transaction(async (tx) => {
      const mesas = await tx.mesa.updateMany({ where: { fiscalId: u.id }, data: { fiscalId: null } });
      detachedMesas += mesas.count;
      const asigs = await (tx as any).asignacion.deleteMany({ where: { userId: u.id } });
      deletedAsignaciones += asigs.count ?? 0;
      const fgs = await tx.escuela.updateMany({ where: { fgId: u.id }, data: { fgId: null } });
      clearedFgs += fgs.count;
      await tx.user.delete({ where: { id: u.id } });
      deletedUsers += 1;
    });
  }

  console.log(JSON.stringify({ candidates: candidates.length, detachedMesas, deletedAsignaciones, clearedFgs, deletedUsers }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
