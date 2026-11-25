import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

export const listUsers = async () => {
  const users = await prisma.user.findMany({
    select: { id: true, nombre: true, apellido: true, email: true, role: true, dni: true, celular: true },
    orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
  });
  return users;
};

export const createUser = async (data: { nombre: string; apellido: string; email: string; role: 'coordinador' | 'encargado_seccion' | 'fiscal_general' | 'fiscal_mesa'; password: string; dni?: string | null; celular?: string | null; }) => {
  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: { nombre: data.nombre, apellido: data.apellido, email: data.email, role: data.role, password: hashed, dni: data.dni ?? null, celular: data.celular ?? null },
    select: { id: true, nombre: true, apellido: true, email: true, role: true, dni: true, celular: true },
  });
  return user;
};

export const deleteUser = async (id: string) => {
  // Clean assignments and FG pointers
  return prisma.$transaction(async (tx) => {
    await (tx as any).asignacion.deleteMany({ where: { userId: id } }).catch(() => {});
    await (tx as any).escuela.updateMany({ where: { fgId: id }, data: { fgId: null } }).catch(() => {});
    await tx.user.delete({ where: { id } });
  });
};

export const resetPassword = async (id: string, newPassword: string) => {
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id }, data: { password: hashed } });
  return { ok: true };
};