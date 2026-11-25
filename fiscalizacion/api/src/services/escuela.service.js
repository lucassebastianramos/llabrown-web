import prisma from '../lib/prisma.js';
export const getAllEscuelas = (seccion, search) => {
    const where = {};
    if (seccion) {
        where.seccion = Number(seccion);
    }
    if (search) {
        where.OR = [
            { nombre: { contains: search, mode: 'insensitive' } },
            { domicilio: { contains: search, mode: 'insensitive' } },
        ];
    }
    return prisma.escuela.findMany({
        where,
        include: {
            incidencias: true,
            // Si necesitas contar incidencias, puedes usar _count
            _count: {
                select: {
                    incidencias: true,
                },
            },
        },
    });
};
export const createEscuela = (data) => {
    return prisma.escuela.create({
        data,
    });
};
export const updateEscuela = (id, data) => {
    const updateData = {};
    if (data.nombre !== undefined)
        updateData.nombre = data.nombre;
    if (data.domicilio !== undefined)
        updateData.domicilio = data.domicilio;
    if (data.circuito !== undefined)
        updateData.circuito = data.circuito;
    if (data.seccion !== undefined)
        updateData.seccion = data.seccion;
    if (data.fgId !== undefined)
        updateData.fgId = data.fgId; // puede ser string o null
    return prisma.escuela.update({
        where: { id },
        data: updateData,
    });
};
//# sourceMappingURL=escuela.service.js.map