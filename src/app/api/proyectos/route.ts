import { NextResponse } from 'next/server';
import { getProyectosDB, createProyectoDB } from '@/lib/db';
import { isAdminAuthorized } from '@/lib/adminAuth';
import { ProyectoHCD } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const proyectos = await getProyectosDB();
    return NextResponse.json(proyectos);
  } catch {
    return NextResponse.json({ error: 'Error al consultar proyectos.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!isAdminAuthorized(req)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body: ProyectoHCD = await req.json();
    if (!body.titulo || !body.resumen) {
      return NextResponse.json({ error: 'Título y resumen son requeridos' }, { status: 400 });
    }

    const newProject = await createProyectoDB({
      ...body,
      id: body.id || `p-${Date.now()}`,
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear el proyecto.' }, { status: 500 });
  }
}
