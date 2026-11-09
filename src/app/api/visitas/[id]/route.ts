import { NextResponse } from 'next/server';
import { deleteVisitaDB } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const success = await deleteVisitaDB(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar la visita.' }, { status: 500 });
  }
}
