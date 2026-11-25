export declare const registerUser: (userData: any) => Promise<{
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
}>;
export declare const loginUser: (credentials: any) => Promise<{
    token: string;
}>;
//# sourceMappingURL=auth.service.d.ts.map