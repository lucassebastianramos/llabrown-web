import { Request, Response } from 'express';
import * as userService from '../services/user.service.js';

export const list = async (_req: Request, res: Response) => {
  try {
    const users = await userService.listUsers();
    res.json(users);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const create = async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, email, role, password, dni, celular } = req.body || {};
    if (!nombre || !apellido || !email || !role || !password) return res.status(400).json({ error: 'Datos incompletos' });
    const user = await userService.createUser({ nombre, apellido, email, role, password, dni, celular });
    res.status(201).json(user);
  } catch (e: any) {
    const msg = String(e?.message || '').toLowerCase();
    if (msg.includes('unique') || msg.includes('duplicate')) return res.status(400).json({ error: 'Email ya registrado' });
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const remove = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Id requerido' });
    await userService.deleteUser(id);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body || {};
    if (!id || !password) return res.status(400).json({ error: 'Id y password requeridos' });
    await userService.resetPassword(id, password);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};