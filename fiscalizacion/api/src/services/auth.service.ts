import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const randPassword = (len = 12) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const registerUser = async (userData: any) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  // @ts-ignore mustChangePassword will exist after prisma generate
  return (prisma as any).user.create({
    data: { ...userData, password: hashedPassword, mustChangePassword: true },
  });
};

export const createUserWithTempPassword = async (data: { nombre: string; apellido: string; email: string; role: any; dni?: string | null; celular?: string | null }) => {
  const temp = randPassword();
  const hashed = await bcrypt.hash(temp, 10);
  // @ts-ignore
  const user = await (prisma as any).user.create({ data: { ...data, password: hashed, mustChangePassword: true } });
  // @ts-ignore
  await (prisma as any).passwordHistory.create({ data: { userId: user.id, passwordHash: hashed } });
  // TODO: send email with temp password
  return { user, tempPassword: temp };
};

const buildToken = (user: any) => jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '12h' });

export const loginUser = async (credentials: any) => {
  const user = await prisma.user.findUnique({ where: { email: credentials.email } });
  if (!user) throw new Error('Invalid credentials');
  const isPasswordValid = await bcrypt.compare(credentials.password, (user as any).password);
  if (!isPasswordValid) throw new Error('Invalid credentials');

  // If must change password, return flag (no token yet)
  if ((user as any).mustChangePassword) {
    return { mustChangePassword: true, userId: user.id } as any;
  }

  const policy = await getSecurityPolicy();
  if ((policy as any).enforce2FA) {
    const code = (Math.floor(100000 + Math.random() * 900000)).toString();
    const token = crypto.randomBytes(24).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 10);
    // @ts-ignore
    await (prisma as any).twoFactorToken.create({ data: { userId: user.id, token, code, expiresAt: expires } });
    // TODO: send code by email
    return { require2FA: true, token } as any;
  }

  const token = buildToken(user);
  return { token };
};

export const completeFirstLogin = async (params: { userId: string; newPassword: string; questions: Array<{ question: string; answer: string }> }) => {
  const policy = await getSecurityPolicy();
  await validatePasswordPolicy(params.newPassword, params.userId, policy);
  const hashed = await bcrypt.hash(params.newPassword, 10);
  await prisma.$transaction(async (tx) => {
    // @ts-ignore
    await (tx as any).user.update({ where: { id: params.userId }, data: { password: hashed, mustChangePassword: false } });
    // Save questions
    const q = (params.questions || []).slice(0, Math.max(0, (policy as any).questionsCount));
    if (q.length) {
      // @ts-ignore
      await (tx as any).securityQuestion.deleteMany({ where: { userId: params.userId } });
      for (const item of q) {
        const ansHash = await bcrypt.hash(item.answer, 10);
        // @ts-ignore
        await (tx as any).securityQuestion.create({ data: { userId: params.userId, question: item.question, answerHash: ansHash } });
      }
    }
    // Add password history
    // @ts-ignore
    await (tx as any).passwordHistory.create({ data: { userId: params.userId, passwordHash: hashed } });
  });
  return { ok: true };
};

export const verify2FA = async (token: string, code: string) => {
  // @ts-ignore
  const rec = await (prisma as any).twoFactorToken.findUnique({ where: { token } });
  if (!rec || rec.used || new Date(rec.expiresAt).getTime() < Date.now()) throw new Error('Invalid or expired 2FA');
  if (rec.code !== code) throw new Error('Invalid 2FA code');
  // @ts-ignore
  await (prisma as any).twoFactorToken.update({ where: { id: rec.id }, data: { used: true } });
  const user = await prisma.user.findUnique({ where: { id: rec.userId } });
  if (!user) throw new Error('User not found');
  return { token: buildToken(user) };
};

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;
  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 30);
  // @ts-ignore
  await (prisma as any).passwordReset.create({ data: { userId: (user as any).id, token, expiresAt: expires } });
  // TODO: send email with token link
  return { token, expiresAt: expires.toISOString() };
};

export const resetPassword = async (token: string, newPassword: string) => {
  // @ts-ignore
  const pr = await (prisma as any).passwordReset.findUnique({ where: { token } });
  if (!pr) throw new Error('Invalid token');
  if (pr.used) throw new Error('Token already used');
  if (new Date(pr.expiresAt).getTime() < Date.now()) throw new Error('Token expired');
  const policy = await getSecurityPolicy();
  await validatePasswordPolicy(newPassword, pr.userId, policy);
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction(async (tx) => {
    // @ts-ignore
    await (tx as any).user.update({ where: { id: pr.userId }, data: { password: hashed, mustChangePassword: false } });
    // @ts-ignore
    await (tx as any).passwordReset.update({ where: { id: pr.id }, data: { used: true } });
    // @ts-ignore
    await (tx as any).passwordHistory.create({ data: { userId: pr.userId, passwordHash: hashed } });
  });
  return { ok: true };
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  const asign = await (prisma as any).asignacion.findMany({ where: { userId }, select: { escuelaId: true } });
  const escuelaIds = asign.map((a: any) => a.escuelaId);
  const escuelas = escuelaIds.length ? await prisma.escuela.findMany({ where: { id: { in: escuelaIds } }, select: { circuito: true } }) : [];
  const circuitos = Array.from(new Set(escuelas.map((e) => String((e as any).circuito)))).filter(Boolean);
  return {
    id: (user as any).id,
    nombre: (user as any).nombre,
    apellido: (user as any).apellido,
    email: (user as any).email,
    role: (user as any).role,
    circuitos,
  };
};

// Security helpers
export const getSecurityPolicy = async () => {
  // @ts-ignore
  let policy = await (prisma as any).securityPolicy.findUnique({ where: { id: 'default' } });
  // @ts-ignore
  if (!policy) policy = await (prisma as any).securityPolicy.create({ data: { id: 'default' } });
  return policy;
};

export const updateSecurityPolicy = async (data: any) => {
  // @ts-ignore
  return (prisma as any).securityPolicy.upsert({
    where: { id: 'default' },
    update: data,
    create: { id: 'default', ...data },
  });
};

export const validatePasswordPolicy = async (password: string, userId: string, policy?: any) => {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  const p = policy || (await getSecurityPolicy());
  if (password.length < (p as any).minLen) throw new Error('Password demasiado corta');
  if ((p as any).requireUpperLower && !( /[A-Z]/.test(password) && /[a-z]/.test(password) )) throw new Error('Debe combinar mayúsculas y minúsculas');
  if ((p as any).requireNumber && !/[0-9]/.test(password)) throw new Error('Debe incluir números');
  if ((p as any).requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':",.<>/?]/.test(password)) throw new Error('Debe incluir un carácter especial');
  if ((p as any).forbidPII && u) {
    const hay = (s?: string | null) => (s || '').toLowerCase().replace(/\W+/g, '');
    const pw = hay(password);
    const checks = [hay((u as any).nombre), hay((u as any).apellido), hay(((u as any).email as string)?.split('@')[0]), hay((u as any).dni), hay((u as any).fechaNac as any)];
    if (checks.some((x) => x && x.length >= 3 && pw.includes(x!))) throw new Error('No debe contener datos personales');
  }
  if ((p as any).noReuseLastN > 0) {
    // @ts-ignore
    const last = await (prisma as any).passwordHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: (p as any).noReuseLastN });
    for (const h of last) {
      const same = await bcrypt.compare(password, (h as any).passwordHash);
      if (same) throw new Error('No puede reutilizar contraseñas anteriores');
    }
  }
};

export const getSecurityQuestionsForUser = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { userId: null, questions: [] };
  // @ts-ignore
  const qs = await (prisma as any).securityQuestion.findMany({ where: { userId: (user as any).id }, select: { id: true, question: true } });
  return { userId: (user as any).id, questions: qs };
};

export const verifySecurityAnswersAndIssueTemp = async (userId: string, answers: Array<{ id: string; answer: string }>) => {
  // @ts-ignore
  const rows = await (prisma as any).securityQuestion.findMany({ where: { userId } });
  if (!rows.length) throw new Error('No hay preguntas configuradas');
  for (const a of answers) {
    const row = (rows as any[]).find((r: any) => r.id === a.id);
    if (!row) throw new Error('Pregunta inválida');
    const ok = await bcrypt.compare(a.answer, row.answerHash);
    if (!ok) throw new Error('Respuesta incorrecta');
  }
  const temp = randPassword();
  const hashed = await bcrypt.hash(temp, 10);
  // @ts-ignore
  await (prisma as any).user.update({ where: { id: userId }, data: { password: hashed, mustChangePassword: true } });
  // @ts-ignore
  await (prisma as any).passwordHistory.create({ data: { userId, passwordHash: hashed } });
  // TODO: send email with temp
  return { tempPassword: temp };
};