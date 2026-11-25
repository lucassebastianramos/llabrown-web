import prisma from '../lib/prisma.js';

const normalizeNombre = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const normalizeDomicilio = (s: string) => (s || '')
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/\b(nº|n°|no)\b/g, 'n')
  .replace(/\be\/\b/g, 'entre')
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();
const normalizeCircuito = (raw: string | null | undefined): string => {
  const s = String(raw || '').trim();
  if (!s) return '';
  const m = s.match(/^(\d+)([A-Za-z].*)?$/);
  if (!m) return s.toUpperCase();
  const num = (m[1] ?? '').replace(/^0+/, '') || '0';
  const suf = m[2] ?? '';
  return `${num}${suf.toUpperCase()}`;
};

async function mergeEscuela(canonical: any, dupe: any) {
  console.log(`\n[escuelas] Merge '${dupe.nombre}' (${dupe.id}) -> '${canonical.nombre}' (${canonical.id})`);

  // Refresh data
  canonical = await (prisma as any).escuela.findUnique({ where: { id: canonical.id }, include: { mesas: true } });
  dupe = await (prisma as any).escuela.findUnique({ where: { id: dupe.id }, include: { mesas: true } });

  // Move mesas with collision handling by nro
  for (const m of dupe.mesas || []) {
    const existing = (canonical.mesas || []).find((x: any) => x.nro === m.nro);
    if (existing) {
      if (!existing.fiscalId && m.fiscalId) {
        await (prisma as any).mesa.update({ where: { id: existing.id }, data: { fiscalId: m.fiscalId } });
      }
      await (prisma as any).mesa.delete({ where: { id: m.id } }).catch(() => {});
    } else {
      await (prisma as any).mesa.update({ where: { id: m.id }, data: { escuelaId: canonical.id } });
    }
  }

  // Move incidencias
  await (prisma as any).incidencia.updateMany({ where: { escuelaId: dupe.id }, data: { escuelaId: canonical.id } });

  // Move asignaciones with upsert to avoid unique conflicts
  const asigns: any[] = await (prisma as any).asignacion.findMany({ where: { escuelaId: dupe.id } });
  for (const a of asigns) {
    await (prisma as any).asignacion.upsert({
      where: { userId_escuelaId_role: { userId: a.userId, escuelaId: canonical.id, role: a.role } },
      update: {},
      create: { userId: a.userId, escuelaId: canonical.id, role: a.role },
    });
  }
  await (prisma as any).asignacion.deleteMany({ where: { escuelaId: dupe.id } }).catch(() => {});

  // Move user.escuelaId pointers and Fiscal model pointers
  await (prisma as any).user.updateMany({ where: { escuelaId: dupe.id }, data: { escuelaId: canonical.id } });
  await (prisma as any).fiscal.updateMany({ where: { escuelaId: dupe.id }, data: { escuelaId: canonical.id } }).catch(() => {});

  // FG merge: prefer canonical; if canonical no FG but dupe tiene, adoptarlo
  if (!canonical.fgId && dupe.fgId) {
    await (prisma as any).escuela.update({ where: { id: canonical.id }, data: { fgId: dupe.fgId } });
  }

  // Coordinates and metadata improvements
  const updates: any = {};
  if ((canonical.lat == null || canonical.lng == null) && (dupe.lat != null && dupe.lng != null)) {
    updates.lat = dupe.lat; updates.lng = dupe.lng;
  }
  const normCanal = normalizeCircuito(canonical.circuito);
  const normDupe = normalizeCircuito(dupe.circuito);
  if (!normCanal && normDupe) updates.circuito = normDupe; else if (normCanal !== canonical.circuito) updates.circuito = normCanal;
  if ((!canonical.seccion || canonical.seccion === 0) && (dupe.seccion && dupe.seccion > 0)) updates.seccion = dupe.seccion;
  if (Object.keys(updates).length) {
    await (prisma as any).escuela.update({ where: { id: canonical.id }, data: updates });
  }

  // Finally delete duplicate
  await (prisma as any).escuela.delete({ where: { id: dupe.id } }).catch(() => {});
}

async function main() {
  console.log('[escuelas] Starting deduplication');
  const escuelas: any[] = await (prisma as any).escuela.findMany({ select: { id: true, nombre: true, domicilio: true, circuito: true, seccion: true, lat: true, lng: true, fgId: true } });
  const groups = new Map<string, any[]>();
  for (const e of escuelas) {
    const key = normalizeNombre(e.nombre);
    if (!key) continue;
    const arr = groups.get(key) || []; arr.push(e); groups.set(key, arr);
  }

  let merged = 0;
  for (const [key, arr] of groups.entries()) {
    if (arr.length <= 1) continue;
    // Heuristic: prefer with FG, else with coords, else with more mesas (we'll fetch counts), else first
    let canonical = arr[0];
    const withFg = arr.find(e => !!e.fgId);
    if (withFg) canonical = withFg;
    else {
      const withCoords = arr.find(e => e.lat != null && e.lng != null);
      if (withCoords) canonical = withCoords;
    }

    // Merge the rest into canonical
    for (const dupe of arr) {
      if (dupe.id === canonical.id) continue;
      await mergeEscuela(canonical, dupe);
      merged += 1;
    }
  }
  // Dedupe also by domicilio normalized (in case names differ slightly but address matches)
  const byDomi = new Map<string, any[]>();
  for (const e of escuelas) {
    const dk = normalizeDomicilio(e.domicilio);
    if (!dk) continue;
    const arr = byDomi.get(dk) || []; arr.push(e); byDomi.set(dk, arr);
  }
  for (const [dk, arr] of byDomi.entries()) {
    if (arr.length <= 1) continue;
    // pick canonical using same heuristic
    let canonical = arr[0];
    const withFg = arr.find(e => !!e.fgId);
    if (withFg) canonical = withFg; else {
      const withCoords = arr.find(e => e.lat != null && e.lng != null);
      if (withCoords) canonical = withCoords;
    }
    for (const dupe of arr) {
      if (dupe.id === canonical.id) continue;
      await mergeEscuela(canonical, dupe);
      merged += 1;
    }
  }
  console.log(`[escuelas] Done. Merged ${merged} duplicates.`);
}

main().finally(() => (prisma as any).$disconnect());
