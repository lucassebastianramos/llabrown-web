import { NextResponse } from 'next/server';
import { updateReclamoDB } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { ReclamoVecinal } from '@/types';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body: Partial<ReclamoVecinal> = await req.json();

    const updated = await updateReclamoDB(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Reclamo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el reclamo.' }, { status: 500 });
  }
}
