export declare const getAllIncidencias: () => import(".prisma/client").Prisma.PrismaPromise<{
    id: string;
    escuelaId: string | null;
    createdAt: Date;
    estado: import(".prisma/client").$Enums.IncidentStatus;
    tipo: import(".prisma/client").$Enums.IncidentType;
    descripcion: string;
}[]>;
type IncidentType = 'ausencia_fiscal' | 'problema_tecnico' | 'irregularidad' | 'consulta' | 'otro';
type IncidentStatus = 'abierta' | 'en_proceso' | 'resuelta' | 'cerrada';
export declare const createIncidencia: (data: {
    tipo: IncidentType;
    estado: IncidentStatus;
    descripcion: string;
    escuelaId: string;
}) => import(".prisma/client").Prisma.Prisma__IncidenciaClient<{
    id: string;
    escuelaId: string | null;
    createdAt: Date;
    estado: import(".prisma/client").$Enums.IncidentStatus;
    tipo: import(".prisma/client").$Enums.IncidentType;
    descripcion: string;
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const updateIncidencia: (id: string, data: {
    tipo?: IncidentType;
    estado?: IncidentStatus;
    descripcion?: string;
    escuelaId?: string;
}) => import(".prisma/client").Prisma.Prisma__IncidenciaClient<{
    id: string;
    escuelaId: string | null;
    createdAt: Date;
    estado: import(".prisma/client").$Enums.IncidentStatus;
    tipo: import(".prisma/client").$Enums.IncidentType;
    descripcion: string;
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const deleteIncidencia: (id: string) => import(".prisma/client").Prisma.Prisma__IncidenciaClient<{
    id: string;
    escuelaId: string | null;
    createdAt: Date;
    estado: import(".prisma/client").$Enums.IncidentStatus;
    tipo: import(".prisma/client").$Enums.IncidentType;
    descripcion: string;
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export {};
//# sourceMappingURL=incidencia.service.d.ts.map