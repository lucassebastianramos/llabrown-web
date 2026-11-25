import { Request, Response } from 'express';
import { getSnapshot, getEntityCSV, BackupEntity } from '../services/backup.service.js';

export const snapshot = async (req: Request, res: Response) => {
  try {
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const data = await getSnapshot({ from, to });
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="snapshot.json"');
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
  try {
    const entity = req.params.entity as BackupEntity;
    const from = req.query.from ? new Date(String(req.query.from)) : undefined;
    const to = req.query.to ? new Date(String(req.query.to)) : undefined;
    const fields = typeof req.query.fields === 'string' ? String(req.query.fields).split(',').map((s) => s.trim()).filter(Boolean) : undefined;
    const { filename, csv } = await getEntityCSV(entity, { from, to, fields });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (e: any) {
    console.error(e);
    res.status(400).json({ error: e?.message || 'Error al exportar' });
  }
};
