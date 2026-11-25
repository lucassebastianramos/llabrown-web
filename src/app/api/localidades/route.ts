import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { createLocalidadDB, getLocalidadesDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeAll = url.searchParams.get('scope') === 'all';
    const user = getSessionUser(req);
    const list = await getLocalidadesDB(includeAll && user?.role === 'admin');
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: 'Error al consultar localidades.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden añadir localidades.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body?.nombre?.trim()) {
      return NextResponse.json({ error: 'El nombre de la localidad es obligatorio.' }, { status: 400 });
    }

    const created = await createLocalidadDB(
      {
        id: '',
        nombre: String(body.nombre).trim(),
        circuito: String(body.circuito || '0019').trim(),
        wa: String(body.wa || 'https://wa.me/5491131596936').trim(),
        descripcion: String(body.descripcion || '').trim(),
        coordenadas: [Number(body.lat) || -34.81, Number(body.lng) || -58.38],
        hitos: Array.isArray(body.hitos)
          ? body.hitos
          : typeof body.hitos === 'string'
            ? body.hitos.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [],
        referenteNombre: String(body.referenteNombre || `Equipo Territorial ${body.nombre}`).trim(),
        destacado: String(body.destacado || '').trim(),
        orden: Number(body.orden) || 20,
      },
      user
    );
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'No se pudo agregar la localidad.' }, { status: 500 });
  }
}
