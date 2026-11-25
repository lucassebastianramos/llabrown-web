import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  createSessionToken,
  getSessionUser,
} from '@/lib/adminAuth';
import { authenticateUserDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = getSessionUser(req);
  return NextResponse.json({
    authenticated: user !== null,
    user,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const username = typeof body?.username === 'string' ? body.username : 'admin';
    const password = typeof body?.password === 'string' ? body.password : '';

    const user = await authenticateUserDB(username, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario o contraseña incorrectos. Verificá tus credenciales con Coordinación.' },
        { status: 401 }
      );
    }

    const token = createSessionToken(user);
    const res = NextResponse.json({ ok: true, authenticated: true, user });
    res.cookies.set(ADMIN_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ADMIN_COOKIE_MAX_AGE,
    });
    return res;
  } catch {
    return NextResponse.json({ error: 'Solicitud inválida' }, { status: 400 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, authenticated: false, user: null });
  res.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return res;
}
