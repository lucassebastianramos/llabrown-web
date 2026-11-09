import crypto from 'crypto';

export const ADMIN_COOKIE_NAME = 'lla_admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 horas

function getSigningSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.DATABASE_URL ||
    'lla-brown-hcd-session-signing-key-2026'
  );
}

function getAllowedPasswords(): string[] {
  if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.trim().length > 0) {
    return process.env.ADMIN_PASSWORD.split(',').map((p) => p.trim()).filter(Boolean);
  }
  return ['lla2025', 'brown2026', 'aquino'];
}

export function verifyAdminPassword(candidate: string): boolean {
  if (!candidate || typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  const allowed = getAllowedPasswords();

  return allowed.some((valid) => {
    const a = Buffer.from(trimmed, 'utf8');
    const b = Buffer.from(valid, 'utf8');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  });
}

export function createAdminSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = crypto.randomBytes(12).toString('hex');
  const payload = `${exp}.${nonce}`;
  const sig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('hex');
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [expStr, nonce, providedSig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return false;
  }

  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(`${expStr}.${nonce}`)
    .digest('hex');

  const a = Buffer.from(providedSig, 'utf8');
  const b = Buffer.from(expectedSig, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAdminAuthorized(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') || '';
  const match = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${ADMIN_COOKIE_NAME}=`));

  if (!match) return false;
  const token = decodeURIComponent(match.slice(ADMIN_COOKIE_NAME.length + 1));
  return verifyAdminSessionToken(token);
}

export const ADMIN_COOKIE_MAX_AGE = SESSION_TTL_SECONDS;
