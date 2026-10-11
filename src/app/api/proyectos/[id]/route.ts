import { NextResponse } from 'next/server';
import { deleteProyectoDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteProyectoDB(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
