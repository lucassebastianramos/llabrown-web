import { NextResponse } from 'next/server';
import { getProyectosDB, createProyectoDB } from '@/lib/db';
import { ProyectoHCD } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const proyectos = await getProyectosDB();
    return NextResponse.json(proyectos);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: ProyectoHCD = await req.json();
    if (!body.titulo || !body.resumen) {
      return NextResponse.json({ error: 'Título y resumen son requeridos' }, { status: 400 });
    }

    const newProject = await createProyectoDB({
      ...body,
      id: body.id || `p-${Date.now()}`
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
