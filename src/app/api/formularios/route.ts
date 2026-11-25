import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { createFormularioDB, getFormulariosDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const includeAll = url.searchParams.get('scope') === 'all';
    const user = getSessionUser(req);
    const list = await getFormulariosDB(includeAll && user?.role === 'admin');
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: 'Error al consultar formularios.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden crear formularios.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body?.titulo?.trim() || !Array.isArray(body?.campos) || body.campos.length === 0) {
      return NextResponse.json(
        { error: 'El formulario necesita título y al menos un campo.' },
        { status: 400 }
      );
    }

    const created = await createFormularioDB(
      {
        slug: String(body.slug || body.titulo),
        titulo: String(body.titulo).trim(),
        descripcion: String(body.descripcion || '').trim(),
        categoria: String(body.categoria || 'General').trim(),
        emailNotificacion: body.emailNotificacion ? String(body.emailNotificacion).trim() : undefined,
        campos: body.campos,
        activo: body.activo !== false,
      },
      user
    );
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'No se pudo crear el formulario (verificá que el slug no esté duplicado).' }, { status: 400 });
  }
}
