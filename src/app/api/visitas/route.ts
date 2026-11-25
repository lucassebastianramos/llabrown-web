import { NextResponse } from 'next/server';
import { getVisitasDB, createVisitaDB } from '@/lib/db';
import { getSessionUser } from '@/lib/adminAuth';
import { VisitaTerritorial } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope');
    const user = getSessionUser(req);

    if (scope === 'all' && user) {
      const visitas = await getVisitasDB({
        includeAll: user.role === 'admin',
        createdBy: user.role === 'editor' ? user.username : undefined,
      });
      return NextResponse.json(visitas);
    }

    const visitas = await getVisitasDB();
    return NextResponse.json(visitas);
  } catch {
    return NextResponse.json({ error: 'Error al consultar visitas.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Iniciá sesión para cargar recorridas.' }, { status: 401 });
  }

  try {
    const body: VisitaTerritorial = await req.json();
    if (!body.titulo || !body.descripcion) {
      return NextResponse.json({ error: 'Título y descripción son requeridos' }, { status: 400 });
    }

    const newVisita = await createVisitaDB(
      {
        ...body,
        id: body.id || `v-${Date.now()}`,
      },
      user
    );

    return NextResponse.json(newVisita, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al registrar la visita.' }, { status: 500 });
  }
}
