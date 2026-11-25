import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { createNoticiaDB, getNoticiasDB } from '@/lib/db';
import { NoticiaAmbito } from '@/types';

export const dynamic = 'force-dynamic';

const VALID_AMBITOS = new Set<NoticiaAmbito>(['Nación', 'Provincia', 'Distrito', 'Novedades']);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope');
    const ambito = url.searchParams.get('ambito') || undefined;
    const user = getSessionUser(req);

    if (scope === 'all' && user) {
      const items = await getNoticiasDB({
        includeAll: user.role === 'admin',
        createdBy: user.role === 'editor' ? user.username : undefined,
        ambito,
      });
      return NextResponse.json(items);
    }

    const publicItems = await getNoticiasDB({ ambito });
    return NextResponse.json(publicItems);
  } catch {
    return NextResponse.json({ error: 'Error al consultar noticias.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Iniciá sesión para publicar novedades.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (!body?.titulo?.trim() || !body?.bajada?.trim() || !body?.cuerpo?.trim()) {
      return NextResponse.json(
        { error: 'Título, bajada y desarrollo son obligatorios.' },
        { status: 400 }
      );
    }

    const ambito: NoticiaAmbito = VALID_AMBITOS.has(body.ambito) ? body.ambito : 'Distrito';
    const created = await createNoticiaDB(
      {
        id: `not-${Date.now()}`,
        titulo: String(body.titulo).trim().slice(0, 220),
        bajada: String(body.bajada).trim().slice(0, 420),
        cuerpo: String(body.cuerpo).trim().slice(0, 8000),
        ambito,
        localidad: body.localidad ? String(body.localidad).trim().slice(0, 120) : 'Almirante Brown',
        imagenUrl: body.imagenUrl ? String(body.imagenUrl).trim() : '/img/a6.jpg',
        fuenteUrl: body.fuenteUrl ? String(body.fuenteUrl).trim() : undefined,
        autor: body.autor ? String(body.autor).trim().slice(0, 120) : user.nombre,
        fecha:
          body.fecha ||
          new Date().toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
        destacada: user.role === 'admin' ? !!body.destacada : false,
      },
      user
    );

    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al guardar la noticia.' }, { status: 500 });
  }
}
