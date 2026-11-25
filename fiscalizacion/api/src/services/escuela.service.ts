import prisma from '../lib/prisma.js';
import { geocodeAddress, geocodeAddressVariants } from './geocode.service.js';

export const getAllEscuelas = (seccion?: string, search?: string, allowedCircuitos?: string[], allowedEscuelaIds?: string[]) => {
  const where: any = {};
  if (seccion) {
    where.seccion = Number(seccion);
  }
  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { domicilio: { contains: search, mode: 'insensitive' } },
    ];
  }
  // Prefer explicit escuela scope when present
  if (allowedEscuelaIds && allowedEscuelaIds.length) {
    where.id = { in: allowedEscuelaIds } as any;
  } else if (allowedCircuitos && allowedCircuitos.length) {
    where.circuito = { in: allowedCircuitos } as any;
  }

  return prisma.escuela.findMany({
    where,
    include: ({
      fg: true,
      incidencias: true,
      mesas: true,
      // Si necesitas contar incidencias, puedes usar _count
      _count: {
        select: {
          incidencias: true,
        },
      },
    } as any),
  });
};

export const createEscuela = async (data: { nombre: string; domicilio: string; circuito: string; seccion: number }) => {
  const toCreate: any = { ...data };
  if (data.domicilio) {
    const fullAddress = `${data.domicilio}${data.circuito ? ', ' + data.circuito : ''}`;
    const geo = await geocodeAddressVariants({ domicilio: fullAddress, nombre: data.nombre });
    if (geo) {
      toCreate.lat = geo.lat;
      toCreate.lng = geo.lng;
    }
  }
  return prisma.escuela.create({ data: toCreate });
};

export const updateEscuela = (
  id: string,
  data: { nombre?: string; domicilio?: string; circuito?: string; seccion?: number; fgId?: string | null; lat?: number | null; lng?: number | null }
) => {
  const updateData: any = {};
  if (data.nombre !== undefined) updateData.nombre = data.nombre;
  if (data.domicilio !== undefined) updateData.domicilio = data.domicilio;
  if (data.circuito !== undefined) {
    const s = String(data.circuito ?? '').trim();
    const m = s.match(/^(\d+)([A-Za-z].*)?$/);
    if (m) {
      const num = (m[1] ?? '').replace(/^0+/, '') || '0';
      const suf = m[2] ?? '';
      updateData.circuito = `${num}${suf.toUpperCase()}`;
    } else {
      updateData.circuito = s;
    }
  }
  if (data.seccion !== undefined) {
    const sec = Number(data.seccion);
    updateData.seccion = Number.isFinite(sec) ? sec : 0;
  }
  if (data.fgId !== undefined) updateData.fgId = data.fgId; // puede ser string o null
  if (data.lat !== undefined) updateData.lat = data.lat; // permitir setear manualmente (incluye null)
  if (data.lng !== undefined) updateData.lng = data.lng; // permitir setear manualmente (incluye null)

  return prisma.$transaction(async (tx) => {
    // Si el usuario provee lat/lng manualmente, respetarlos y no recalcular geocoding
    const manualGeoProvided = data.lat !== undefined || data.lng !== undefined;

    // If address or circuito changed and no manual geo provided, re-geocode using merged values
    if (!manualGeoProvided && (data.domicilio !== undefined || data.circuito !== undefined)) {
      const existing = await tx.escuela.findUnique({
        where: { id },
        select: { nombre: true, domicilio: true, circuito: true },
      });
      const domicilio = data.domicilio !== undefined ? data.domicilio : existing?.domicilio ?? '';
      const circuito = data.circuito !== undefined ? data.circuito : existing?.circuito ?? '';
      const parts = [domicilio, circuito].filter(Boolean);
      if (parts.length) {
        const fullAddress = parts.join(', ');
        const nombre = data.nombre !== undefined ? data.nombre : existing?.nombre ?? null;
        const geo = await geocodeAddressVariants({ domicilio: fullAddress, nombre });
        if (geo) {
          updateData.lat = geo.lat;
          updateData.lng = geo.lng;
        }
      }
    }

    return tx.escuela.update({
      where: { id },
      data: updateData,
    });
  });
};

export const geocodeMissingEscuelas = async () => {
  // Try typed filter first; if it fails at runtime due to schema mismatch, we will fallback to raw.
  let missing: Array<{ id: string; nombre: string; domicilio: string; circuito: string | null }> = [] as any;
  try {
    missing = await prisma.escuela.findMany({
      where: { OR: [
        // @ts-ignore lat may not be in the generated types if client is stale
        { lat: { equals: null } },
        // @ts-ignore lng may not be in the generated types if client is stale
        { lng: { equals: null } }
      ] },
      select: { id: true, nombre: true, domicilio: true, circuito: true },
    }) as any;
  } catch (e) {
    // Fallback raw query
    const rows = await prisma.$queryRawUnsafe<any[]>(
      'SELECT id, nombre, domicilio, circuito FROM "Escuela" WHERE lat IS NULL OR lng IS NULL'
    );
    missing = rows.map(r => ({ id: r.id, nombre: r.nombre, domicilio: r.domicilio, circuito: r.circuito }));
  }
  if (!missing.length) {
    console.log('[escuelas] No schools pending geocode');
    return { total: 0, updated: 0, failed: 0 };
  }
  let updated = 0;
  let failed = 0;
  console.log(`[escuelas] Pending geocode: ${missing.length}`);
  for (const e of missing) {
    const parts = [e.domicilio, e.circuito].filter(Boolean);
    if (!parts.length) {
      console.warn(`[escuelas] Skipping ${e.id}: no domicilio/circuito`);
      continue;
    }
    const fullAddress = parts.join(', ');
    console.log(`[escuelas] Geocoding ${e.id}: ${fullAddress}`);
  const geo = await geocodeAddressVariants({ domicilio: fullAddress, nombre: e.nombre });
    if (geo) {
      try {
  // @ts-ignore lat/lng may not be in client types
        await prisma.escuela.update({ where: { id: e.id }, data: { lat: geo.lat, lng: geo.lng } });
      } catch {
        await prisma.$executeRawUnsafe(
          'UPDATE "Escuela" SET lat = $1, lng = $2 WHERE id = $3',
          geo.lat,
          geo.lng,
          e.id
        );
      }
      console.log(`[escuelas] Geocoded ${e.id} -> ${geo.lat}, ${geo.lng}`);
      updated += 1;
    } else {
      console.warn(`[escuelas] Failed geocoding ${e.id}`);
      failed += 1;
    }
    // tiny delay to be polite with public API
    await new Promise((r) => setTimeout(r, 500));
  }
  return { total: missing.length, updated, failed };
};

export const deleteEscuela = async (id: string) => {
  return prisma.$transaction(async (tx) => {
    // Limpiar fgId si hay
    await tx.escuela.updateMany({ where: { id }, data: { fgId: null } });

    // Desasociar usuarios (escuelaId)
    await tx.user.updateMany({ where: { escuelaId: id }, data: { escuelaId: null } });

    // Borrar fiscales ligados al modelo Fiscal
    await tx.fiscal.deleteMany({ where: { escuelaId: id } }).catch(() => {});

    // Borrar incidencias
    await tx.incidencia.deleteMany({ where: { escuelaId: id } }).catch(() => {});

    // Borrar asignaciones
    await (tx as any).asignacion.deleteMany({ where: { escuelaId: id } }).catch(() => {});

    // Borrar escuela
    await tx.escuela.delete({ where: { id } });
  });
};

export const getEscuelaById = (id: string) => {
  return prisma.escuela.findUnique({
    where: { id },
    include: ({
      fg: true,
      incidencias: true,
      mesas: { include: { fiscal: true } },
      _count: { select: { incidencias: true } },
    } as any),
  });
};