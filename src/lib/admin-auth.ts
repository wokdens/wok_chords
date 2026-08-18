import { createHmac, timingSafeEqual, randomBytes } from 'node:crypto';

export const COOKIE_NAME = 'wok_admin_sess';
export const DEFAULT_PASSWORD = 'wokchords123';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const KEY_SEED = () =>
  (import.meta.env.ADMIN_SECRET as string | undefined)?.trim() ||
  'wokchords-local-secret-change-me';

export function getPassword(): string {
  const env = (import.meta.env.ADMIN_PASSWORD as string | undefined)?.trim();
  if (env && env.length > 0) return env;
  return DEFAULT_PASSWORD;
}

function sign(value: string): string {
  const hmac = createHmac('sha256', KEY_SEED());
  const sig = hmac.update(value).digest('base64url');
  return `${value}.${sig}`;
}

function verify(signed: string): string | null {
  const idx = signed.lastIndexOf('.');
  if (idx < 0) return null;
  const value = signed.slice(0, idx);
  const sig = signed.slice(idx + 1);
  const hmac = createHmac('sha256', KEY_SEED());
  const expected = hmac.update(value).digest('base64url');
  try {
    const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    return ok ? value : null;
  } catch {
    return null;
  }
}

export function createSession(): string {
  const now = Date.now();
  const expires = now + SESSION_TTL_MS;
  const nonce = randomBytes(8).toString('base64url');
  const payload = `${expires.toString(36)}.${nonce}`;
  return sign(payload);
}

export function validateSession(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false;
  const cookies = cookieHeader.split(';').map((c) => c.trim());
  const match = cookies
    .find((c) => c.startsWith(COOKIE_NAME + '='));
  if (!match) return false;
  const val = decodeURIComponent(match.slice(COOKIE_NAME.length + 1));
  const payload = verify(val);
  if (!payload) return false;
  const [expStr] = payload.split('.');
  const exp = parseInt(expStr, 36);
  if (!Number.isFinite(exp)) return false;
  return exp > Date.now();
}

export function passwordHash(pw: string): string {
  return createHmac('sha256', KEY_SEED()).update(pw).digest('hex');
}

export function checkPassword(input: string): boolean {
  const expected = passwordHash(getPassword());
  const actual = passwordHash(input);
  try {
    return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
  } catch {
    return false;
  }
}
