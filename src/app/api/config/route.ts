import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { getSiteConfigDB, updateSiteConfigDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const config = await getSiteConfigDB();
    return NextResponse.json(config);
  } catch {
    return NextResponse.json({ error: 'Error al consultar configuración.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden editar la configuración del sitio.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { zohoSmtpPass, ...rest } = body || {};
    const updated = await updateSiteConfigDB(rest, typeof zohoSmtpPass === 'string' ? zohoSmtpPass : undefined, user);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Error al guardar configuración.' }, { status: 500 });
  }
}
