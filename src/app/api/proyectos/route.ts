import { NextResponse } from 'next/server';
import { getProyectosDB, createProyectoDB } from '@/lib/db';
import { getSessionUser } from '@/lib/adminAuth';
import { ProyectoHCD } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope');
    const user = getSessionUser(req);

    if (scope === 'all' && user) {
      const proyectos = await getProyectosDB({
        includeAll: user.role === 'admin',
        createdBy: user.role === 'editor' ? user.username : undefined,
      });
      return NextResponse.json(proyectos);
    }

    const proyectos = await getProyectosDB();
    return NextResponse.json(proyectos);
  } catch {
    return NextResponse.json({ error: 'Error al consultar proyectos.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Iniciá sesión para cargar expedientes.' }, { status: 401 });
  }

  try {
    const body: ProyectoHCD = await req.json();
    if (!body.titulo || !body.resumen) {
      return NextResponse.json({ error: 'Título y resumen son requeridos' }, { status: 400 });
    }

    const newProject = await createProyectoDB(
      {
        ...body,
        id: body.id || `p-${Date.now()}`,
        autor: body.autor?.trim() || user.nombre,
      },
      user
    );

    return NextResponse.json(newProject, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Error al crear el proyecto.' }, { status: 500 });
  }
}
