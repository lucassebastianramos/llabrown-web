import prisma from '../lib/prisma.js';
export const getAllIncidencias = () => {
    return prisma.incidencia.findMany();
};
export const createIncidencia = (data) => {
    return prisma.incidencia.create({
        data,
    });
};
export const updateIncidencia = (id, data) => {
    return prisma.incidencia.update({
        where: { id },
        data,
    });
};
export const deleteIncidencia = (id) => {
    return prisma.incidencia.delete({
        where: { id },
    });
};
//# sourceMappingURL=incidencia.service.js.map