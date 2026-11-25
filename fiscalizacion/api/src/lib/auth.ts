import jwt from 'jsonwebtoken';
import { Request } from 'express';

export const getAuthUser = (req: Request): { userId: string; role?: string } | null => {
  try {
    const hdr = req.headers['authorization'] || req.headers['Authorization'];
    if (!hdr || typeof hdr !== 'string') return null;
    const m = hdr.match(/^Bearer\s+(.+)$/i);
    const token = m ? m[1] : null;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    if (!decoded?.userId) return null;
    return { userId: decoded.userId, role: decoded.role };
  } catch {
    return null;
  }
};
