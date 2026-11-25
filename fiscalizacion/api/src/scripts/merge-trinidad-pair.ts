import prisma from '../lib/prisma.js';

const CANONICAL_ID = 'bd22a7bf-df71-4948-835f-44efe003c045';
const DUPLICATE_ID = 'bb6fcf1e-bf41-44d7-b7bb-767d7239f562';

async function migrateLegacy(userId: string) {
  const user: any = await (prisma as any).user.findUnique({ where: { id: userId } });
  if (!user?.escuelaId) return;
  await (prisma as any).asignacion.upsert({
    where: { userId_escuelaId_role: { userId, escuelaId: user.escuelaId, role: user.role } },
    update: {},
    create: { userId, escuelaId: user.escuelaId, role: user.role },
  }).catch(() => {});
}

async function main() {
  const canonical: any = await (prisma as any).user.findUnique({ where: { id: CANONICAL_ID } });
  const dupe: any = await (prisma as any).user.findUnique({ where: { id: DUPLICATE_ID } });
  if (!canonical || !dupe) {
    console.log('[merge] IDs no válidos o ya fusionados');
    return;
  }

  await migrateLegacy(DUPLICATE_ID);

  const asigns: any[] = await (prisma as any).asignacion.findMany({ where: { userId: DUPLICATE_ID } });
  for (const a of asigns) {
    await (prisma as any).asignacion.upsert({
      where: { userId_escuelaId_role: { userId: CANONICAL_ID, escuelaId: a.escuelaId, role: a.role } },
      update: {},
      create: { userId: CANONICAL_ID, escuelaId: a.escuelaId, role: a.role },
    }).catch(() => {});
  }
  await (prisma as any).escuela.updateMany({ where: { fgId: DUPLICATE_ID }, data: { fgId: CANONICAL_ID } }).catch(() => {});

  await (prisma as any).asignacion.deleteMany({ where: { userId: DUPLICATE_ID } }).catch(() => {});
  await (prisma as any).user.delete({ where: { id: DUPLICATE_ID } }).catch(() => {});

  console.log('[merge] Fusionado OK');
}

main().finally(() => (prisma as any).$disconnect());