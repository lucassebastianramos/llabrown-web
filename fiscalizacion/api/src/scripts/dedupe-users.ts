import prisma from '../lib/prisma.js';

const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = (s: string) => norm(s).split(' ').filter(Boolean);
const fingerprint = (nombre: string, apellido: string) => {
  const arr = [...tokens(nombre), ...tokens(apellido)];
  arr.sort();
  return arr.join(' ');
};
const roleRank = (r: string) => ({ coordinador: 4, encargado_seccion: 3, fiscal_general: 2, fiscal_mesa: 1 } as any)[r] || 0;

async function migrateLegacyEscuelaIdToAsignaciones(user: any) {
  if (!user.escuelaId) return;
  try {
    await (prisma as any).asignacion.upsert({
      where: { userId_escuelaId_role: { userId: user.id, escuelaId: user.escuelaId, role: user.role } },
      update: {},
      create: { userId: user.id, escuelaId: user.escuelaId, role: user.role },
    });
  } catch {}
}

async function main() {
  console.log('[dedupe] Starting enhanced deduplication');
  const users: any[] = await (prisma as any).user.findMany({ select: { id: true, nombre: true, apellido: true, dni: true, role: true, escuelaId: true, email: true } });

  // Phase 0: migrate legacy escuelaId to assignments for all users
  for (const u of users) {
    await migrateLegacyEscuelaIdToAsignaciones(u);
  }

  // Phase 1: Group by DNI
  const byDni = new Map<string, any[]>();
  for (const u of users) if (u.dni) {
    const arr = byDni.get(u.dni) || []; arr.push(u); byDni.set(u.dni, arr);
  }

  let merged = 0;

  for (const [dni, arr] of byDni.entries()) {
    if (arr.length <= 1) continue;
    // Prefer coordinador if present, else the first
    const canonical = arr.find(u => u.role === 'coordinador') || arr[0];
    for (const dupe of arr) {
      if (dupe.id === canonical.id) continue;
      await migrateLegacyEscuelaIdToAsignaciones(dupe);
      // Move all assignments
      const asigns: any[] = await (prisma as any).asignacion.findMany({ where: { userId: dupe.id } });
      for (const a of asigns) {
        await (prisma as any).asignacion.upsert({
          where: { userId_escuelaId_role: { userId: canonical.id, escuelaId: a.escuelaId, role: a.role } },
          update: {},
          create: { userId: canonical.id, escuelaId: a.escuelaId, role: a.role },
        });
      }
      // Fix FG pointers
      await (prisma as any).escuela.updateMany({ where: { fgId: dupe.id }, data: { fgId: canonical.id } });
      // Remove dupe
      await (prisma as any).asignacion.deleteMany({ where: { userId: dupe.id } }).catch(() => {});
      await (prisma as any).user.delete({ where: { id: dupe.id } }).catch(() => {});
      merged += 1;
    }
  }

  // Reload users without DNI groups
  const remaining: any[] = await (prisma as any).user.findMany({ select: { id: true, nombre: true, apellido: true, dni: true, role: true, escuelaId: true, email: true, celular: true } });

  // Phase 2: Group by order-insensitive name fingerprint
  const groups = new Map<string, any[]>();
  for (const u of remaining) {
    const fp = fingerprint(u.nombre || '', u.apellido || '');
    if (!fp) continue;
    const arr = groups.get(fp) || []; arr.push(u); groups.set(fp, arr);
  }

  for (const [key, arr] of groups.entries()) {
    if (arr.length <= 1) continue;
    // If any two have conflicting non-empty DNI, skip this group to be safe
    const nonEmptyDni = Array.from(new Set(arr.map(u => (u.dni || '').trim()).filter(Boolean)));
    if (nonEmptyDni.length > 1) continue;
    // Pick canonical: highest role, else with DNI, else first
    let canonical = arr[0];
    for (const u of arr) {
      if (roleRank(u.role) > roleRank(canonical.role)) canonical = u;
    }
    if (!canonical.dni) {
      const withDni = arr.find(u => !!u.dni);
      if (withDni) canonical = withDni;
    }
    for (const dupe of arr) {
      if (dupe.id === canonical.id) continue;
      await migrateLegacyEscuelaIdToAsignaciones(dupe);
      // Adopt missing fields
      const patch: any = {};
      if (!canonical.dni && dupe.dni) patch.dni = dupe.dni;
      if (!canonical.celular && dupe.celular) patch.celular = dupe.celular;
      if (roleRank(dupe.role) > roleRank(canonical.role)) patch.role = dupe.role;
      if (Object.keys(patch).length) await (prisma as any).user.update({ where: { id: canonical.id }, data: patch });

      // Move all assignments
      const asigns: any[] = await (prisma as any).asignacion.findMany({ where: { userId: dupe.id } });
      for (const a of asigns) {
        await (prisma as any).asignacion.upsert({
          where: { userId_escuelaId_role: { userId: canonical.id, escuelaId: a.escuelaId, role: a.role } },
          update: {},
          create: { userId: canonical.id, escuelaId: a.escuelaId, role: a.role },
        });
      }
      // Fix FG pointers
      await (prisma as any).escuela.updateMany({ where: { fgId: dupe.id }, data: { fgId: canonical.id } });
      // Remove dupe
      await (prisma as any).asignacion.deleteMany({ where: { userId: dupe.id } }).catch(() => {});
      await (prisma as any).user.delete({ where: { id: dupe.id } }).catch(() => {});
      merged += 1;
    }
  }

  console.log(`[dedupe] Done. Merged ${merged} duplicates.`);
}

main().finally(() => (prisma as any).$disconnect());
