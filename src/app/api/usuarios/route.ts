import { NextResponse } from 'next/server';
import { getSessionUser, isAdminAuthorized } from '@/lib/adminAuth';
import { createUsuarioDB, getUsuariosDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }
  const users = await getUsuariosDB();
  return NextResponse.json(users);
}

export async function POST(req: Request) {
  const actor = getSessionUser(req);
  if (!actor || actor.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    if (!body?.username || !body?.nombre || !body?.password || String(body.password).trim().length < 4) {
      return NextResponse.json(
        { error: 'Completá usuario, nombre completo y una contraseña de al menos 4 caracteres.' },
        { status: 400 }
      );
    }

    const created = await createUsuarioDB(
      {
        username: String(body.username),
        nombre: String(body.nombre),
        role: body.role === 'admin' ? 'admin' : 'editor',
        cargo: String(body.cargo || 'Equipo Concejal / Consejero'),
        email: body.email ? String(body.email) : undefined,
        password: String(body.password),
      },
      actor
    );
    return NextResponse.json(created, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'No se pudo crear la cuenta (verificá que el usuario no esté duplicado).' }, { status: 400 });
  }
}
