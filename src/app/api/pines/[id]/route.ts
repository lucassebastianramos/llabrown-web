import { NextResponse } from 'next/server';
import { deletePinDB, apoyarPinDB } from '@/lib/db';
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

    const success = await deletePinDB(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Pin no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el pin.' }, { status: 500 });
  }
}

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const newCount = await apoyarPinDB(params.id);
    return NextResponse.json({ success: true, apoyosVecinales: newCount });
  } catch {
    return NextResponse.json({ error: 'Error al registrar el apoyo vecinal.' }, { status: 500 });
  }
}
