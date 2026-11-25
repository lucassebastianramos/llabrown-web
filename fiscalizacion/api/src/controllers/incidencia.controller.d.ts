import { Request, Response } from 'express';
export declare const getIncidencias: (req: Request, res: Response) => Promise<void>;
export declare const createIncidencia: (req: Request, res: Response) => Promise<void>;
export declare const updateIncidencia: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const deleteIncidencia: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=incidencia.controller.d.ts.map