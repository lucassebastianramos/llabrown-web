import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { deleteMiembroEquipoDB, updateMiembroEquipoDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await updateMiembroEquipoDB(params.id, body, user);
    if (!updated) return NextResponse.json({ error: 'Integrante no encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el integrante.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }

  const ok = await deleteMiembroEquipoDB(params.id, user);
  if (!ok) return NextResponse.json({ error: 'Integrante no encontrado' }, { status: 404 });
  return NextResponse.json({ success: true, respaldadoEnBD: true });
}
