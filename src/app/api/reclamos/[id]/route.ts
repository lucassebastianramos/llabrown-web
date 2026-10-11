import { NextResponse } from 'next/server';
import { updateReclamoDB } from '@/lib/db';
import { ReclamoVecinal } from '@/types';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: Partial<ReclamoVecinal> = await req.json();

    const updated = await updateReclamoDB(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Reclamo no encontrado' }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
