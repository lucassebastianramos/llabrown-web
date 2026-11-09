import { NextResponse } from 'next/server';
import { getReclamosDB, createReclamoDB } from '@/lib/db';
import { forwardToBrownGestion } from '@/lib/municipalReclamoService';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { ReclamoVecinal } from '@/types';

export const dynamic = 'force-dynamic';

function clampStr(val: unknown, max: number): string {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, max);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const codigoParam = url.searchParams.get('codigo')?.trim().toUpperCase();

    const reclamos = await getReclamosDB();

    // Consulta pública de estado por código exacto (sin exponer DNI, teléfono ni altura exacta)
    if (codigoParam) {
      const found = reclamos.find(
        (r) => r.codigoSeguimiento.trim().toUpperCase() === codigoParam
      );
      if (!found) {
        return NextResponse.json(
          { error: 'No encontramos un reclamo registrado con ese código. Verificá que esté bien escrito (ej: LLA-REC-2026-1234).' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        reclamo: {
          codigoSeguimiento: found.codigoSeguimiento,
          localidad: found.localidad,
          barrio: found.barrio,
          tipoReclamo: found.tipoReclamo,
          estado: found.estado,
          numeroReclamoMunicipal: found.numeroReclamoMunicipal,
          patrocinadoPor: found.patrocinadoPor,
          fecha: found.fecha,
        },
      });
    }

    // Listado completo exclusivo para el panel de concejales autenticado
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    return NextResponse.json(reclamos);
  } catch {
    return NextResponse.json({ error: 'No se pudieron consultar los reclamos.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: Partial<ReclamoVecinal> = await req.json();

    const nombreVecino = clampStr(body.nombreVecino, 120);
    const telefonoVecino = clampStr(body.telefonoVecino, 48);
    const localidad = clampStr(body.localidad, 80) as ReclamoVecinal['localidad'];
    const calle = clampStr(body.calle, 160);
    const tipoReclamo = clampStr(body.tipoReclamo, 120);
    const descripcion = clampStr(body.descripcion, 2000);

    if (!nombreVecino || !telefonoVecino || !localidad || !calle || !tipoReclamo || !descripcion) {
      return NextResponse.json(
        {
          error:
            'Completá los datos obligatorios: nombre, teléfono, localidad, calle, categoría y detalle del problema.',
        },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const codigoSeguimiento = `LLA-REC-${year}-${randomSuffix}`;
    const id = `rec-${Date.now()}`;
    const fecha = new Date().toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const newReclamo: ReclamoVecinal = {
      id,
      codigoSeguimiento,
      nombreVecino,
      apellidoVecino: clampStr(body.apellidoVecino, 100) || undefined,
      dniVecino: clampStr(body.dniVecino, 24) || undefined,
      telefonoVecino,
      localidad,
      barrio: clampStr(body.barrio, 120) || undefined,
      calle,
      altura: clampStr(body.altura, 24) || undefined,
      entreCalles: clampStr(body.entreCalles, 160) || undefined,
      tipoReclamo,
      subtipoReclamo: clampStr(body.subtipoReclamo, 120) || undefined,
      descripcion,
      normaDigesto: clampStr(body.normaDigesto, 240) || undefined,
      estado: 'Registrado en LLA',
      patrocinadoPor: 'Juan Pedro Aquino · Jefe de Bloque Concejales LLA',
      fecha,
      lat: typeof body.lat === 'number' && Number.isFinite(body.lat) ? body.lat : undefined,
      lng: typeof body.lng === 'number' && Number.isFinite(body.lng) ? body.lng : undefined,
    };

    const saved = await createReclamoDB(newReclamo);

    let publicMsg =
      'Reclamo registrado por el Bloque de Concejales LLA para su ingreso formal y auditoría municipal.';

    try {
      const forwardResult = await forwardToBrownGestion(saved);
      if (forwardResult.numeroReclamoMunicipal) {
        saved.numeroReclamoMunicipal = forwardResult.numeroReclamoMunicipal;
        saved.estado = 'Enviado a Gestión Municipal';
      }
      if (forwardResult.mensaje) {
        publicMsg = forwardResult.mensaje;
      }
    } catch (fErr) {
      console.warn('Forward attempt failed:', fErr);
    }

    return NextResponse.json(
      {
        ok: true,
        reclamo: saved,
        resultadoMunicipal: {
          mensaje: publicMsg,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: 'No pudimos registrar el reclamo en este momento. Intentá nuevamente o escribinos por WhatsApp.' },
      { status: 500 }
    );
  }
}
