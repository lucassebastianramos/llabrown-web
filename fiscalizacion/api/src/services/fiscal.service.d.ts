export declare const getAllFiscales: () => import(".prisma/client").Prisma.PrismaPromise<{
    id: string;
    nombre: string;
    apellido: string;
    role: import(".prisma/client").$Enums.UserRole;
    dni: string | null;
    celular: string | null;
    escuelaId: string | null;
}[]>;
export declare const createFiscal: (data: {
    nombre: string;
    apellido: string;
    dni: string;
    celular: string;
    role: "coordinador" | "encargado_seccion" | "fiscal_general" | "fiscal_mesa";
    escuelaId: string;
    email: string;
    password: string;
}) => import(".prisma/client").Prisma.Prisma__UserClient<{
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    password: string;
    role: import(".prisma/client").$Enums.UserRole;
    dni: string | null;
    celular: string | null;
    seccionId: number | null;
    escuelaId: string | null;
    createdAt: Date;
    updatedAt: Date;
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const updateFiscal: (id: string, data: {
    nombre?: string;
    apellido?: string;
    dni?: string;
    celular?: string;
    role?: "coordinador" | "encargado_seccion" | "fiscal_general" | "fiscal_mesa";
    escuelaId?: string;
    email?: string;
    password?: string;
}) => import(".prisma/client").Prisma.Prisma__UserClient<{
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    password: string;
    role: import(".prisma/client").$Enums.UserRole;
    dni: string | null;
    celular: string | null;
    seccionId: number | null;
    escuelaId: string | null;
    createdAt: Date;
    updatedAt: Date;
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const deleteFiscal: (id: string) => import(".prisma/client").Prisma.Prisma__UserClient<{
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    password: string;
    role: import(".prisma/client").$Enums.UserRole;
    dni: string | null;
    celular: string | null;
    seccionId: number | null;
    escuelaId: string | null;
    createdAt: Date;
    updatedAt: Date;
}, never, import("@prisma/client/runtime/library").DefaultArgs>;
//# sourceMappingURL=fiscal.service.d.ts.map