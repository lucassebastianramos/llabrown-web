import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { createMiembroEquipoDB, getMiembrosEquipoDB } from '@/lib/db';
import { TipoMiembroEquipo } from '@/types';

export const dynamic = 'force-dynamic';

const VALID_TIPOS = new Set<TipoMiembroEquipo>([
  'concejal',
  'consejero',
  'legislador_provincial',
  'legislador_nacional',
]);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeAll = url.searchParams.get('scope') === 'all';
    const user = getSessionUser(req);
    const list = await getMiembrosEquipoDB(includeAll && user?.role === 'admin');
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: 'Error al consultar el equipo.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden gestionar integrantes.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body?.nombre?.trim() || !body?.rol?.trim() || !VALID_TIPOS.has(body.tipo)) {
      return NextResponse.json(
        { error: 'Nombre, cargo y categoría institucional son obligatorios.' },
        { status: 400 }
      );
    }

    const created = await createMiembroEquipoDB(
      {
        id: `eq-${Date.now()}`,
        nombre: String(body.nombre).trim(),
        rol: String(body.rol).trim(),
        localidad: String(body.localidad || 'Almirante Brown').trim(),
        foto: String(body.foto || '/img/a6.jpg').trim(),
        estilo: body.estilo ? String(body.estilo) : undefined,
        tipo: body.tipo,
        bio: body.bio ? String(body.bio).trim() : undefined,
        orden: typeof body.orden === 'number' ? body.orden : 10,
        redes:
          body.instagram || body.twitter
            ? {
                instagram: body.instagram ? String(body.instagram).trim() : undefined,
                twitter: body.twitter ? String(body.twitter).trim() : undefined,
              }
            : undefined,
      },
      user
    );
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al agregar el integrante.' }, { status: 500 });
  }
}
