import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { deleteFormularioDB, getFormularioBySlugDB, updateFormularioDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const form = await getFormularioBySlugDB(params.slug);
    if (!form || !form.activo) {
      return NextResponse.json({ error: 'Formulario no encontrado o cerrado.' }, { status: 404 });
    }
    return NextResponse.json(form);
  } catch {
    return NextResponse.json({ error: 'Error al obtener el formulario.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { slug: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden editar formularios.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await updateFormularioDB(params.slug, body, user);
    if (!updated) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el formulario.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { slug: string } }) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden eliminar formularios.' }, { status: 403 });
  }

  const ok = await deleteFormularioDB(params.slug, user);
  if (!ok) return NextResponse.json({ error: 'Formulario no encontrado' }, { status: 404 });
  return NextResponse.json({ success: true, respaldadoEnBD: true });
}
