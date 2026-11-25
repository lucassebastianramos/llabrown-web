import { NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/adminAuth';
import {
  createFormularioRespuestaDB,
  getFormularioBySlugDB,
  getFormularioRespuestasDB,
} from '@/lib/db';
import { sendZohoMail } from '@/lib/mailService';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Solo administradores pueden ver las respuestas.' }, { status: 403 });
  }

  try {
    const list = await getFormularioRespuestasDB(params.slug);
    return NextResponse.json(list);
  } catch {
    return NextResponse.json({ error: 'Error al consultar respuestas.' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { slug: string } }) {
  try {
    const form = await getFormularioBySlugDB(params.slug);
    if (!form || !form.activo) {
      return NextResponse.json({ error: 'Este formulario no existe o ya no acepta respuestas.' }, { status: 404 });
    }

    const body = await req.json();
    const rawDatos = body?.datos && typeof body.datos === 'object' ? body.datos : body;
    const sanitized: Record<string, string | boolean> = {};

    for (const field of form.campos) {
      const val = rawDatos?.[field.id];
      if (field.tipo === 'checkbox') {
        sanitized[field.id] = Boolean(val);
      } else {
        const str = typeof val === 'string' ? val.trim().slice(0, 2000) : '';
        if (field.requerido && !str) {
          return NextResponse.json(
            { error: `El campo "${field.label}" es obligatorio.` },
            { status: 400 }
          );
        }
        sanitized[field.id] = str;
      }
    }

    const saved = await createFormularioRespuestaDB(form.id, form.slug, sanitized);

    // Notificación automática por Zoho Mail si está configurada casilla de aviso
    if (form.emailNotificacion) {
      const resumenLineas = form.campos
        .map((c) => `- ${c.label}: ${typeof sanitized[c.id] === 'boolean' ? (sanitized[c.id] ? 'Sí' : 'No') : sanitized[c.id] || '(vacío)'}`)
        .join('\n');

      sendZohoMail({
        remitente: form.emailNotificacion,
        destinatarios: [form.emailNotificacion],
        asunto: `[LLA Brown] Nueva respuesta en "${form.titulo}"`,
        cuerpo: `Se registró una nueva respuesta en el formulario "${form.titulo}" (/f/${form.slug}):\n\n${resumenLineas}\n\nID de respaldo en base de datos: ${saved.id}`,
        enviadoPor: 'formulario-web',
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true, respuesta: saved }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'No pudimos guardar tu respuesta. Intentá nuevamente.' }, { status: 500 });
  }
}
