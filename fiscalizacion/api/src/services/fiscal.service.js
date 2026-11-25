import prisma from '../lib/prisma.js';
export const getAllFiscales = () => {
    return prisma.user.findMany({
        where: {
            OR: [
                { role: 'fiscal_general' },
                { role: 'fiscal_mesa' },
            ],
        },
        select: {
            id: true,
            nombre: true,
            apellido: true,
            dni: true,
            celular: true,
            role: true,
            escuelaId: true,
        },
    });
};
export const createFiscal = (data) => {
    return prisma.user.create({
        data: {
            nombre: data.nombre,
            apellido: data.apellido,
            dni: data.dni,
            celular: data.celular,
            role: data.role,
            escuelaId: data.escuelaId,
            email: data.email,
            password: data.password,
        },
    });
};
export const updateFiscal = (id, data) => {
    return prisma.user.update({
        where: { id },
        data,
    });
};
export const deleteFiscal = (id) => {
    return prisma.user.delete({
        where: { id },
    });
};
//# sourceMappingURL=fiscal.service.js.map