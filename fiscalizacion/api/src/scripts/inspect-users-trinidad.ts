import prisma from '../lib/prisma.js';

const like = (s: string) => ({ contains: s, mode: 'insensitive' as const });

async function main() {
  const users: any[] = await (prisma as any).user.findMany({
    where: {
      OR: [
        { nombre: like('trinidad') },
        { apellido: like('trinidad') },
        { nombre: like('eugenia') },
        { apellido: like('eugenia') },
      ],
    },
    include: { asignaciones: true },
  });
  console.log('[inspect] count=', users.length);
  for (const u of users) {
    console.log({ id: u.id, nombre: u.nombre, apellido: u.apellido, email: u.email, role: u.role, asignaciones: u.asignaciones });
  }
}

main().finally(() => (prisma as any).$disconnect());