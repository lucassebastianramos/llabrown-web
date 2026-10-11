import { NextResponse } from 'next/server';
import { getReclamosDB, createReclamoDB } from '@/lib/db';
import { forwardToBrownGestion, ForwardResult } from '@/lib/municipalReclamoService';
import { ReclamoVecinal } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reclamos = await getReclamosDB();
    return NextResponse.json(reclamos);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: Partial<ReclamoVecinal> = await req.json();

    if (!body.nombreVecino || !body.telefonoVecino || !body.localidad || !body.calle || !body.tipoReclamo || !body.descripcion) {
      return NextResponse.json(
        { error: 'Por favor complete todos los campos obligatorios: nombre, teléfono, localidad, calle, tipo de reclamo y descripción.' },
        { status: 400 }
      );
    }

    // Generar código de seguimiento institucional de LLA
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
      nombreVecino: body.nombreVecino.trim(),
      apellidoVecino: body.apellidoVecino?.trim(),
      dniVecino: body.dniVecino?.trim(),
      telefonoVecino: body.telefonoVecino.trim(),
      localidad: body.localidad,
      barrio: body.barrio?.trim(),
      calle: body.calle.trim(),
      altura: body.altura?.trim(),
      entreCalles: body.entreCalles?.trim(),
      tipoReclamo: body.tipoReclamo.trim(),
      subtipoReclamo: body.subtipoReclamo?.trim(),
      descripcion: body.descripcion.trim(),
      normaDigesto: body.normaDigesto?.trim(),
      estado: 'Registrado en LLA',
      patrocinadoPor: 'Juan Pedro Aquino - Jefe de Bloque Concejales LLA',
      fecha,
      lat: body.lat,
      lng: body.lng,
    };

    // 1. Guardar en BD primero
    const saved = await createReclamoDB(newReclamo);

    // 2. Ejecutar despacho automático al portal municipal BrownGestión
    let forwardResult: ForwardResult = {
      success: false,
      mensaje: 'Reclamo registrado para seguimiento y auditoría por el Bloque LLA.',
      portalUrl: 'https://www.browngestion.ar/solicitudesciudadanas/',
    };

    try {
      forwardResult = await forwardToBrownGestion(saved);
      if (forwardResult.numeroReclamoMunicipal) {
        saved.numeroReclamoMunicipal = forwardResult.numeroReclamoMunicipal;
        saved.estado = 'Enviado a BrownGestión';
      }
    } catch (fErr) {
      console.warn('Forward attempt failed:', fErr);
    }

    return NextResponse.json(
      {
        ok: true,
        reclamo: saved,
        resultadoMunicipal: forwardResult,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
