// UI Extension security (OneStock "UI Extensibility" documentation):
// - OneStock signs `${timestamp}.${extension_id}##${user_id}` with HMAC-SHA256
//   and sends `extension_signature = "t=<ts>,h0=<latest>,h1=<previous>,h2=<oldest>"`
// - once verified, the extension opens its own short-lived session
//   (signed token sent as `Authorization: Bearer` on every /api call).

import { createHmac, timingSafeEqual } from 'node:crypto';

type Env = Record<string, string | undefined>;

export interface ExtensionContext {
  extension_id: string;
  user_id: string;
  site_id: string;
  extension_signature: string;
}

export interface SessionClaims {
  site_id: string;
  user_id: string;
  extension_id: string;
  exp: number;
}

const SIGNATURE_MAX_AGE_S = 6 * 60 * 60;
const SESSION_TTL_S = 60 * 60;

// Secrets given by OneStock at installation, latest first, comma separated
export const getExtensionSecrets = (env: Env): string[] =>
  (env.ONESTOCK_EXTENSION_SECRETS || '').split(',').map(s => s.trim()).filter(Boolean);

const sessionSecret = (env: Env) => env.SESSION_SECRET || getExtensionSecrets(env)[0] || '';

// Extension mode is enforced as soon as the OneStock secrets are configured
export const isSessionRequired = (env: Env) => getExtensionSecrets(env).length > 0;

const hmacHex = (secret: string, payload: string) => createHmac('sha256', secret).update(payload).digest('hex');

const safeEqual = (a: string, b: string) => {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
};

export const verifyExtensionSignature = (ctx: ExtensionContext, secrets: string[], now = Date.now()): boolean => {
  const parts = String(ctx.extension_signature || '').split(',').map(p => p.trim());
  if (parts.length < 2 || !parts[0].startsWith('t=')) return false;

  const timestamp = parts[0].slice(2);
  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || Math.floor(now / 1000) - ts > SIGNATURE_MAX_AGE_S) return false;

  const hashes = parts.slice(1).map(p => p.replace(/^h\d+=/, ''));
  const payload = `${timestamp}.${ctx.extension_id}##${ctx.user_id}`;
  return secrets.some(secret => {
    const expected = hmacHex(secret, payload);
    return hashes.some(h => safeEqual(h, expected));
  });
};

const b64url = (value: string) => Buffer.from(value).toString('base64url');

export const createSessionToken = (env: Env, ctx: Omit<SessionClaims, 'exp'>, now = Date.now()) => {
  const claims: SessionClaims = { ...ctx, exp: Math.floor(now / 1000) + SESSION_TTL_S };
  const body = b64url(JSON.stringify(claims));
  return { token: `${body}.${hmacHex(sessionSecret(env), body)}`, expiresAt: claims.exp };
};

export const verifySessionToken = (env: Env, token: string, now = Date.now()): SessionClaims | null => {
  const [body, signature] = String(token || '').split('.');
  const secret = sessionSecret(env);
  if (!body || !signature || !secret || !safeEqual(signature, hmacHex(secret, body))) return null;
  try {
    const claims = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionClaims;
    return claims.exp > Math.floor(now / 1000) ? claims : null;
  } catch {
    return null;
  }
};

export const bearerToken = (authorization?: string) =>
  authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
