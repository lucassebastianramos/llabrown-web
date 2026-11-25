import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

export const getAllFiscales = (
  role?: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa',
  allowedCircuitos?: string[]
) => {
  const where: any = {};
  if (role) {
    where.OR = [{ role }, { asignaciones: { some: { role } } }];
  }
  if (allowedCircuitos && allowedCircuitos.length) {
    where.AND = [
      ...(where.AND || []),
      { asignaciones: { some: { escuela: { circuito: { in: allowedCircuitos } } } } },
    ];
  }

  return (prisma as any).user.findMany({
    where,
    include: { asignaciones: true },
  }).then((list: any[]) => list.map((u: any) => ({
    id: u.id,
    nombre: u.nombre,
    apellido: u.apellido,
    dni: u.dni ?? null,
    celular: u.celular ?? null,
    role: u.role,
    mesaNro: (u as any).mesaNro ?? null,
    escuelaId: u.asignaciones?.[0]?.escuelaId ?? u.escuelaId ?? null,
    asignaciones: u.asignaciones || [],
  })) as any);
};

export const getBackupFiscales = async () => {
  // Users with FG/FM and without asignaciones or escuelaId assigned
  const users = await (prisma as any).user.findMany({
    where: {
      OR: [{ role: 'fiscal_general' }, { role: 'fiscal_mesa' }],
      AND: [
        { asignaciones: { none: {} } },
        { OR: [{ escuelaId: null }, { escuelaId: { equals: undefined as any } }] },
      ],
    },
    select: { id: true, nombre: true, apellido: true, dni: true, role: true },
  });
  return { count: users.length, users };
};

export const createFiscal = async (data: {
  nombre: string;
  apellido: string;
  dni?: string | null;
  celular?: string | null;
  role: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa';
  escuelaId?: string | null;
  email: string;
  password: string;
  mesaNro?: string | null;
}) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return prisma.$transaction(async (tx) => {
    let user: any = null;
    if (data.dni) user = await (tx as any).user.findFirst({ where: { dni: data.dni } });
    if (!user) user = await (tx as any).user.findUnique({ where: { email: data.email } });
    if (!user) user = await (tx as any).user.findFirst({ where: { nombre: data.nombre, apellido: data.apellido } });

    if (!user) {
      user = await (tx as any).user.create({
        data: {
          nombre: data.nombre,
          apellido: data.apellido,
          dni: data.dni ?? null,
          celular: data.celular ?? null,
          role: data.role,
          email: data.email,
          password: hashedPassword,
          mesaNro: data.mesaNro ?? null,
        },
      });
    } else {
      const upd: any = {};
      if (!user.dni && data.dni) upd.dni = data.dni;
      if (!user.celular && data.celular) upd.celular = data.celular;
      if (Object.keys(upd).length) await (tx as any).user.update({ where: { id: user.id }, data: upd });
    }

    if (data.escuelaId) {
      // Enforce single-assignment for non-encargado roles
      if (data.role !== 'encargado_seccion') {
        await (tx as any).asignacion.deleteMany({ where: { userId: user.id, role: data.role, NOT: { escuelaId: data.escuelaId } } });
      }
      await (tx as any).asignacion.upsert({
        where: { userId_escuelaId_role: { userId: user.id, escuelaId: data.escuelaId, role: data.role } },
        update: {},
        create: { userId: user.id, escuelaId: data.escuelaId, role: data.role },
      });
    }

    if (data.role === 'fiscal_general' && data.escuelaId) {
      // Keep FG pointer consistent
      await (tx as any).escuela.update({ where: { id: data.escuelaId }, data: { fgId: user.id } });
      // Ensure FG not set in other schools if policy requires single FG per user
      await (tx as any).escuela.updateMany({ where: { fgId: user.id, NOT: { id: data.escuelaId } }, data: { fgId: null } });
    }

    return user;
  });
};

export const updateFiscal = async (
  id: string,
  data: {
    nombre?: string;
    apellido?: string;
    dni?: string;
    celular?: string;
    role?: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa';
    escuelaId?: string | null;
    email?: string;
    password?: string;
    mesaNro?: string | null;
  }
) => {
  return prisma.$transaction(async (tx) => {
    const updateData: any = { ...data };

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const escuelaId = updateData.escuelaId;
    const role = updateData.role;
    delete updateData.escuelaId;

    const updated = await (tx as any).user.update({ where: { id }, data: updateData });

    if (role && escuelaId !== undefined) {
      if (escuelaId) {
        if (role !== 'encargado_seccion') {
          await (tx as any).asignacion.deleteMany({ where: { userId: id, role, NOT: { escuelaId } } });
        }
        await (tx as any).asignacion.upsert({
          where: { userId_escuelaId_role: { userId: id, escuelaId, role } },
          update: {},
          create: { userId: id, escuelaId, role },
        });
      } else {
        await (tx as any).asignacion.deleteMany({ where: { userId: id, role } });
      }
    }

    if (role === 'fiscal_general') {
      if (escuelaId) {
        await (tx as any).escuela.update({ where: { id: escuelaId }, data: { fgId: id } });
        await (tx as any).escuela.updateMany({ where: { fgId: id, NOT: { id: escuelaId } }, data: { fgId: null } });
      } else {
        await (tx as any).escuela.updateMany({ where: { fgId: id }, data: { fgId: null } });
      }
    }

    return updated;
  });
};

export const deleteFiscal = (id: string) => {
  return prisma.$transaction(async (tx) => {
    await (tx as any).asignacion.deleteMany({ where: { userId: id } }).catch(() => {});
    return (tx as any).user.delete({ where: { id } });
  });
};

export const getAsignaciones = async (userId: string) => {
  return (prisma as any).asignacion.findMany({ where: { userId } });
};

export const setAsignaciones = async (userId: string, role: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa', escuelaIds: string[]) => {
  return prisma.$transaction(async (tx) => {
    if (role !== 'encargado_seccion') {
      const first = escuelaIds[0] || null;
      await (tx as any).asignacion.deleteMany({ where: { userId, role, NOT: first ? { escuelaId: first } : {} as any } });
      if (!first) {
        await (tx as any).asignacion.deleteMany({ where: { userId, role } });
      } else {
        await (tx as any).asignacion.upsert({
          where: { userId_escuelaId_role: { userId, escuelaId: first, role } },
          update: {},
          create: { userId, escuelaId: first, role },
        });
      }

      if (role === 'fiscal_general') {
        if (first) {
          await (tx as any).escuela.update({ where: { id: first }, data: { fgId: userId } });
          await (tx as any).escuela.updateMany({ where: { fgId: userId, NOT: { id: first } }, data: { fgId: null } });
        } else {
          await (tx as any).escuela.updateMany({ where: { fgId: userId }, data: { fgId: null } });
        }
      }

      return (tx as any).asignacion.findMany({ where: { userId, role } });
    }

    // Encargado: allow many
    const current: any[] = await (tx as any).asignacion.findMany({ where: { userId, role } });
    const currentSet = new Set(current.map(a => a.escuelaId));
    const incomingSet = new Set(escuelaIds);

    for (const a of current) {
      if (!incomingSet.has(a.escuelaId)) {
        await (tx as any).asignacion.delete({ where: { id: a.id } });
      }
    }
    for (const escuelaId of escuelaIds) {
      if (!currentSet.has(escuelaId)) {
        await (tx as any).asignacion.create({ data: { userId, escuelaId, role } });
      }
    }

    return (tx as any).asignacion.findMany({ where: { userId, role } });
  });
};