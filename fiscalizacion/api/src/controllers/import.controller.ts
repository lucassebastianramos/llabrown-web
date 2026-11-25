import { Request, Response } from 'express';
import * as importService from '../services/import.service.js';
import { ValidationError, importMesasFromXlsx } from '../services/import.service.js';

export const importData = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Basic file-type guard
  const okExt = req.file.originalname.toLowerCase().endsWith('.xlsx') || req.file.originalname.toLowerCase().endsWith('.xls');
  const okMime = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ].includes(req.file.mimetype);
  if (!okExt || !okMime) {
    return res.status(400).json({ error: 'Formato inválido. Subí un Excel (.xlsx o .xls).' });
  }

  try {
    const overwrite = (String(req.query.overwrite ?? '') === '1' || String(req.query.overwrite ?? '').toLowerCase() === 'true');
    const summary = await importService.importDataFromXlsx(req.file.buffer, { overwrite });
    res.json({ message: 'Data imported successfully', overwrite, ...summary });
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const importMesas = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const okExt = req.file.originalname.toLowerCase().endsWith('.xlsx') || req.file.originalname.toLowerCase().endsWith('.xls');
  const okMime = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ].includes(req.file.mimetype);
  if (!okExt || !okMime) {
    return res.status(400).json({ error: 'Formato inválido. Subí un Excel (.xlsx o .xls).' });
  }
  try {
    const createUsers = (String(req.query.createUsers ?? '') === '1' || String(req.query.createUsers ?? '').toLowerCase() === 'true');
    const summary = await importMesasFromXlsx(req.file.buffer, { createUsers });
    res.json({ message: 'Mesas importadas correctamente', createUsers, ...summary });
  } catch (error) {
    console.error(error);
    if (error instanceof ValidationError) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};