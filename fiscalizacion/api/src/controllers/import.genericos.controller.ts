import { Request, Response } from 'express';
import { ValidationError, importGenericosFiscalesMesa, importGenericosFiscalesGenerales, importGenericosEstablecimientos } from '../services/import.service.js';

export const importFiscalesMesaGenericos = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fname = req.file.originalname || 'upload';
  try {
    const summary = await importGenericosFiscalesMesa(req.file.buffer, fname);
    res.json({ message: 'Fiscales de mesa genéricos importados', ...summary });
  } catch (err) {
    console.error(err);
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const importFiscalesGeneralesGenericos = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fname = req.file.originalname || 'upload';
  try {
    const summary = await importGenericosFiscalesGenerales(req.file.buffer, fname);
    res.json({ message: 'Fiscales generales genéricos importados', ...summary });
  } catch (err) {
    console.error(err);
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const importEstablecimientosGenericos = async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fname = req.file.originalname || 'upload';
  try {
    const summary = await importGenericosEstablecimientos(req.file.buffer, fname);
    res.json({ message: 'Establecimientos genéricos importados', ...summary });
  } catch (err) {
    console.error(err);
    if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};
