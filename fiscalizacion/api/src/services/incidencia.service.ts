import prisma from '../lib/prisma.js';

export type IncidentType = 'ausencia_fiscal' | 'problema_tecnico' | 'irregularidad' | 'consulta' | 'otro';
export type IncidentStatus = 'abierta' | 'en_proceso' | 'resuelta' | 'cerrada';

export const getIncidencias = async (params: {
  tipo?: IncidentType;
  estado?: IncidentStatus;
  escuelaId?: string;
  page?: number;
  pageSize?: number;
  allowedCircuitos?: string[];
}) => {
  const { tipo, estado, escuelaId, allowedCircuitos } = params;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.pageSize) || 20));
  const where: any = {};
  if (tipo) where.tipo = tipo;
  if (estado) where.estado = estado;
  if (escuelaId) where.escuelaId = escuelaId;
  // When restricting by allowed circuitos, include items without escuela as well
  if (allowedCircuitos && allowedCircuitos.length) {
    where.OR = [
      { escuela: { circuito: { in: allowedCircuitos } } },
      { escuelaId: null },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.incidencia.findMany({
      where,
      include: { escuela: { select: { id: true, nombre: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.incidencia.count({ where }),
  ]);

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
};

export const createIncidencia = (data: { tipo: IncidentType; estado: IncidentStatus; descripcion: string; escuelaId?: string | null }) => {
  return prisma.incidencia.create({
    data: {
      tipo: data.tipo,
      estado: data.estado,
      descripcion: data.descripcion,
      escuelaId: data.escuelaId ?? null,
    },
  });
};

export const updateIncidencia = (id: string, data: { tipo?: IncidentType; estado?: IncidentStatus; descripcion?: string; escuelaId?: string | null }) => {
  const payload: any = { ...data };
  if ('escuelaId' in (data as any) && data.escuelaId === undefined) {
    // leave as undefined if not provided
  }
  if (data && (data.escuelaId === '' as any)) {
    payload.escuelaId = null;
  }
  return prisma.incidencia.update({
    where: { id },
    data: {
      ...payload,
      escuelaId: payload.escuelaId ?? payload.escuelaId === null ? payload.escuelaId : payload.escuelaId,
    },
  });
};

export const deleteIncidencia = (id: string) => {
  return prisma.incidencia.delete({
    where: { id },
  });
};