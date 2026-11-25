import { Request, Response } from 'express';
import * as authService from '../services/auth.service.js';
import { getAuthUser } from '../lib/auth.js';

export const register = async (req: Request, res: Response) => {
  try {
    const user = await authService.registerUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUser(req.body);
    res.json(result);
  } catch (error: any) {
    if (error.message === 'Invalid credentials') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const requestReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email requerido' });
    const info = await authService.requestPasswordReset(email);
    res.json({ ok: true, ...(info || {}) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ error: 'Token y password requeridos' });
    await authService.resetPassword(token, password);
    res.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message || '').toLowerCase();
    if (msg.includes('invalid') || msg.includes('expired') || msg.includes('used')) return res.status(400).json({ error: e.message });
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth?.userId) return res.status(401).json({ error: 'Unauthorized' });
    const profile = await authService.getMe(auth.userId);
    if (!profile) return res.status(404).json({ error: 'User not found' });
    res.json(profile);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const firstLoginSetup = async (req: Request, res: Response) => {
  try {
    const { userId, newPassword, questions } = req.body || {};
    if (!userId || !newPassword || !Array.isArray(questions)) return res.status(400).json({ error: 'Datos inválidos' });
    const out = await authService.completeFirstLogin({ userId, newPassword, questions });
    res.json(out);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Error' });
  }
};

export const verify2FA = async (req: Request, res: Response) => {
  try {
    const { token, code } = req.body || {};
    if (!token || !code) return res.status(400).json({ error: 'token y code requeridos' });
    const out = await authService.verify2FA(token, code);
    res.json(out);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Error 2FA' });
  }
};

export const securityQuestions = async (req: Request, res: Response) => {
  try {
    const { email } = req.query as any;
    if (!email) return res.status(400).json({ error: 'Email requerido' });
    const data = await authService.getSecurityQuestionsForUser(email);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifySecurityAnswers = async (req: Request, res: Response) => {
  try {
    const { userId, answers } = req.body || {};
    if (!userId || !Array.isArray(answers)) return res.status(400).json({ error: 'Datos inválidos' });
    const out = await authService.verifySecurityAnswersAndIssueTemp(userId, answers);
    res.json(out);
  } catch (e: any) {
    res.status(400).json({ error: e?.message || 'Error' });
  }
};

export const getPolicy = async (_req: Request, res: Response) => {
  const p = await authService.getSecurityPolicy();
  res.json(p);
};

export const updatePolicy = async (req: Request, res: Response) => {
  try {
    const auth = getAuthUser(req);
    if (!auth || auth.role !== 'coordinador') return res.status(403).json({ error: 'Forbidden' });
    const out = await authService.updateSecurityPolicy(req.body || {});
    res.json(out);
  } catch (e) {
    res.status(400).json({ error: 'Error al guardar política' });
  }
};