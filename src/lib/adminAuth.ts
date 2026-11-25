import crypto from 'crypto';
import { SessionUser, UserRole } from '@/types';

export const ADMIN_COOKIE_NAME = 'lla_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 horas

function getSigningSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.DATABASE_URL ||
    'lla-brown-hcd-session-signing-key-2026'
  );
}

/**
 * Hash cryptográfico con scrypt + salt aleatorio (sin dependencias nativas).
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password.trim(), salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPasswordHash(candidate: string, storedHash: string): boolean {
  if (!candidate || !storedHash) return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  const derived = crypto.scryptSync(candidate.trim(), salt, 64);
  const expected = Buffer.from(expectedHex, 'hex');
  if (derived.length !== expected.length) return false;
  return crypto.timingSafeEqual(derived, expected);
}

/**
 * Fallback de claves maestras admin vía env o claves históricas de coordinación.
 */
export function verifyMasterAdminFallback(candidate: string): boolean {
  const trimmed = candidate.trim();
  const allowed =
    process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0
      ? process.env.ADMIN_PASSWORD.split(',').map((p) => p.trim()).filter(Boolean)
      : ['lla2025', 'brown2026', 'aquino'];

  return allowed.some((valid) => {
    const a = Buffer.from(trimmed, 'utf8');
    const b = Buffer.from(valid, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  });
}

export function createSessionToken(user: SessionUser): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payloadObj = {
    exp,
    id: user.id,
    username: user.username,
    nombre: user.nombre,
    role: user.role,
    cargo: user.cargo,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payloadB64)
    .digest('hex');
  return `${payloadB64}.${sig}`;
}

export function parseSessionToken(token: string | undefined | null): SessionUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, providedSig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payloadB64)
    .digest('hex');

  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    const role: UserRole = parsed.role === 'admin' ? 'admin' : 'editor';
    return {
      id: String(parsed.id || ''),
      username: String(parsed.username || ''),
      nombre: String(parsed.nombre || ''),
      role,
      cargo: String(parsed.cargo || ''),
    };
  } catch {
    return null;
  }
}

export function getSessionUser(req: Request): SessionUser | null {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));

  if (!match) return null;
  const token = decodeURIComponent(match.slice(ADMIN_COOKIE_NAME.length + 1));
  return parseSessionToken(token);
}

/**
 * Permite tanto admin como editor autenticado (ej: subir archivo, crear noticia/expediente).
 */
export function isAuthenticatedUser(req: Request): boolean {
  return getSessionUser(req) !== null;
}

/**
 * Exige rol 'admin' estricto (aprobar/denegar, borrar contenidos, gestionar usuarios/localidades/correos).
 */
export function isAdminAuthorized(req: Request): boolean {
  const user = getSessionUser(req);
  return user !== null && user.role === 'admin';
}

export const ADMIN_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;
