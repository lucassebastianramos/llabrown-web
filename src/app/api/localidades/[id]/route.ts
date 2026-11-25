import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { updateLocalidadDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await updateLocalidadDB(params.id, body, user);
    if (!updated) return NextResponse.json({ error: 'Localidad no encontrada' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar la localidad.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }

  const updated = await updateLocalidadDB(params.id, { activo: false }, user);
  if (!updated) return NextResponse.json({ error: 'Localidad no encontrada' }, { status: 404 });
  return NextResponse.json({ success: true, respaldadoEnBD: true });
}
