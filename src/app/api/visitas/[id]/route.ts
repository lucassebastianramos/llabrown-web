import { NextResponse } from 'next/server';
import { deleteVisitaDB, reviewVisitaDB } from '@/lib/db';
import { getSessionUser } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Solo los administradores pueden aprobar o rechazar recorridas.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const decision = body?.decision === 'rechazado' ? 'rechazado' : 'aprobado';
    const updated = await reviewVisitaDB(
      params.id,
      decision,
      user,
      typeof body?.motivoRechazo === 'string' ? body.motivoRechazo.trim() : undefined
    );
    if (!updated) return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error al revisar la recorrida.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Las cuentas de equipo no tienen permiso para eliminar recorridas.' },
      { status: 403 }
    );
  }

  try {
    const success = await deleteVisitaDB(params.id, user);
    if (!success) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, respaldadoEnBD: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la visita.' }, { status: 500 });
  }
}
