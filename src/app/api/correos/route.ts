import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/adminAuth';
import { getCorreosEnviadosDB } from '@/lib/db';
import { sendZohoMail, verifyZohoSmtpConnection } from '@/lib/mailService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso restringido a administradores.' }, { status: 403 });
  }

  const list = await getCorreosEnviadosDB();
  return NextResponse.json(list);
}

export async function POST(req: Request) {
  const user = getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Solo administradores pueden enviar correos institucionales.' }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (body?.action === 'test') {
      const result = await verifyZohoSmtpConnection();
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    const rawDest = Array.isArray(body?.destinatarios)
      ? body.destinatarios
      : typeof body?.destinatarios === 'string'
        ? body.destinatarios.split(/[\n,;]+/)
        : [];

    if (rawDest.length === 0 || !body?.asunto?.trim() || !body?.cuerpo?.trim()) {
      return NextResponse.json(
        { error: 'Completá al menos un destinatario válido, asunto y mensaje.' },
        { status: 400 }
      );
    }

    const record = await sendZohoMail({
      remitente: typeof body?.remitente === 'string' ? body.remitente : undefined,
      destinatarios: rawDest,
      asunto: String(body.asunto),
      cuerpo: String(body.cuerpo),
      enviadoPor: user.username,
    });

    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Error al enviar correo.' }, { status: 400 });
  }
}
