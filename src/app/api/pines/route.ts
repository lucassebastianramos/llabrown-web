import { NextResponse } from 'next/server';
import { getPinesDB, createPinDB } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { PinTerritorial } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const pines = await getPinesDB();
    return NextResponse.json(pines);
  } catch {
    return NextResponse.json({ error: 'Error al consultar pines.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: PinTerritorial = await req.json();
    if (!body.titulo || !body.calle || !body.lat || !body.lng) {
      return NextResponse.json(
        { error: 'Título, calle, latitud y longitud son requeridos' },
        { status: 400 }
      );
    }

    const newPin = await createPinDB({
      ...body,
      id: body.id || `pin-${Date.now()}`,
    });

    return NextResponse.json(newPin, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear el pin territorial.' }, { status: 500 });
  }
}
