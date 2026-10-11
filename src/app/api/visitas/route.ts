import { NextResponse } from 'next/server';
import { getVisitasDB, createVisitaDB } from '@/lib/db';
import { VisitaTerritorial } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const visitas = await getVisitasDB();
    return NextResponse.json(visitas);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: VisitaTerritorial = await req.json();
    if (!body.titulo || !body.descripcion) {
      return NextResponse.json({ error: 'Título y descripción son requeridos' }, { status: 400 });
    }

    const newVisita = await createVisitaDB({
      ...body,
      id: body.id || `v-${Date.now()}`
    });

    return NextResponse.json(newVisita, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
