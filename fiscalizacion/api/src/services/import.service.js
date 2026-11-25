import prisma from '../lib/prisma.js';
import xlsx from 'xlsx';
export const importDataFromXlsx = async (fileBuffer) => {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName)
        return [];
    const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
    if (!sheet)
        return [];
    const data = xlsx.utils.sheet_to_json(sheet);
    return prisma.$transaction(async (tx) => {
        for (const row of data) {
            const { nombre_escuela, domicilio, circuito, seccion, nombre_fiscal, apellido_fiscal, dni_fiscal, celular_fiscal, } = row;
            // Find or create the school
            let escuela = await tx.escuela.findFirst({ where: { nombre: nombre_escuela } });
            if (!escuela) {
                escuela = await tx.escuela.create({
                    data: { nombre: nombre_escuela, domicilio, circuito, seccion: Number(seccion) },
                });
            }
            // If fiscal data is present, create the fiscal and link to the school
            if (nombre_fiscal && apellido_fiscal) {
                // Debes agregar email y password para crear el usuario correctamente
                const fiscal = await tx.user.create({
                    data: {
                        nombre: nombre_fiscal,
                        apellido: apellido_fiscal,
                        dni: String(dni_fiscal),
                        celular: String(celular_fiscal),
                        role: 'fiscal_general',
                        escuelaId: escuela.id,
                        email: `${nombre_fiscal}.${apellido_fiscal}@example.com`,
                        password: 'defaultpassword',
                    },
                });
                await tx.escuela.update({
                    where: { id: escuela.id },
                    data: { fgId: fiscal.id },
                });
            }
        }
    });
};
//# sourceMappingURL=import.service.js.map