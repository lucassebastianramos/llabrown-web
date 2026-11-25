export declare const getAllEscuelas: (seccion?: string, search?: string) => import(".prisma/client").Prisma.PrismaPromise<({
    incidencias: {
        id: string;
        escuelaId: string | null;
        createdAt: Date;
        estado: import(".prisma/client").$Enums.IncidentStatus;
        tipo: import(".prisma/client").$Enums.IncidentType;
        descripcion: string;
    }[];
    _count: {
        incidencias: number;
    };
} & {
    id: string;
    nombre: string;
    domicilio: string;
    circuito: string;
    seccion: number;
    fgId: string | null;
})[]>;
export declare const createEscuela: (data: {
    nombre: string;
    domicilio: string;
    circuito: string;
    seccion: number;
}) => import(".prisma/client").Prisma.Prisma__EscuelaClient<{
    id: string;
    nombre: string;
    domicilio: string;
    circuito: string;
    seccion: number;
    fgId: string | null;
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const updateEscuela: (id: string, data: {
    nombre?: string;
    domicilio?: string;
    circuito?: string;
    seccion?: number;
    fgId?: string | null;
}) => import(".prisma/client").Prisma.Prisma__EscuelaClient<{
    id: string;
    nombre: string;
    domicilio: string;
    circuito: string;
    seccion: number;
    fgId: string | null;
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
//# sourceMappingURL=escuela.service.d.ts.map