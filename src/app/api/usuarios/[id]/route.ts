import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { updateUsuarioDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const actor = getSessionUser(req);
  if (!actor || actor.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await updateUsuarioDB(params.id, body, actor);
    if (!updated) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el usuario.' }, { status: 500 });
  }
}
