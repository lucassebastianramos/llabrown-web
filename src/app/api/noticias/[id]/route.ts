import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { deleteNoticiaDB, reviewNoticiaDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo los administradores pueden aprobar o denegar publicaciones.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const decision = body?.decision === 'rechazado' ? 'rechazado' : 'aprobado';
    const updated = await reviewNoticiaDB(
      params.id,
      decision,
      user,
      typeof body?.motivoRechazo === 'string' ? body.motivoRechazo.trim() : undefined
    );
    if (!updated) return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error al moderar la noticia.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Las cuentas de equipo no tienen permiso para eliminar contenidos.' },
      { status: 403 }
    );
  }

  const ok = await deleteNoticiaDB(params.id, user);
  if (!ok) return NextResponse.json({ error: 'Noticia no encontrada' }, { status: 404 });
  return NextResponse.json({ success: true, respaldadoEnBD: true });
}
