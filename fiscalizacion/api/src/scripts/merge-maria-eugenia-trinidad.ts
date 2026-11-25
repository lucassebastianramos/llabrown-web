import prisma from '../lib/prisma.js';

async function upsertLegacy(user: any) {
  if (!user.escuelaId) return;
  await (prisma as any).asignacion.upsert({
    where: { userId_escuelaId_role: { userId: user.id, escuelaId: user.escuelaId, role: user.role } },
    update: {},
    create: { userId: user.id, escuelaId: user.escuelaId, role: user.role },
  }).catch(() => {});
}

async function main() {
  const users: any[] = await (prisma as any).user.findMany({
    where: {
      OR: [
        { nombre: 'MARIA EUGENIA', apellido: 'TRINIDAD' },
        { nombre: 'TRINIDAD', apellido: 'MARIA EUGENIA' },
      ],
    },
    include: { asignaciones: true },
  });

  if (!users.length) {
    console.log('[merge] No se encontraron usuarios para MERGE');
    return;
  }
  if (users.length === 1) {
    console.log('[merge] Solo hay uno, nada para mergear:', users[0].id);
    return;
  }

  // Elegir canónico: más asignaciones, si empata el que tiene más escuelas o el primero
  let canonical = users[0];
  for (const u of users) {
    if ((u.asignaciones?.length || 0) > (canonical.asignaciones?.length || 0)) {
      canonical = u;
    }
  }
  const dupes = users.filter(u => u.id !== canonical.id);

  console.log('[merge] Canonical:', canonical.id, canonical.nombre, canonical.apellido);

  for (const dupe of dupes) {
    await upsertLegacy(dupe);
    // mover asignaciones
    const asigns: any[] = await (prisma as any).asignacion.findMany({ where: { userId: dupe.id } });
    for (const a of asigns) {
      await (prisma as any).asignacion.upsert({
        where: { userId_escuelaId_role: { userId: canonical.id, escuelaId: a.escuelaId, role: a.role } },
        update: {},
        create: { userId: canonical.id, escuelaId: a.escuelaId, role: a.role },
      }).catch(() => {});
    }
    // FG pointers
    await (prisma as any).escuela.updateMany({ where: { fgId: dupe.id }, data: { fgId: canonical.id } }).catch(() => {});
    // Borrar dupe
    await (prisma as any).asignacion.deleteMany({ where: { userId: dupe.id } }).catch(() => {});
    await (prisma as any).user.delete({ where: { id: dupe.id } }).catch(() => {});
    console.log('[merge] Eliminado dupe:', dupe.id);
  }

  console.log('[merge] OK');
}

main().finally(() => (prisma as any).$disconnect());