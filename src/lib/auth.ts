/**
 * Auth utilities — zero external dependencies.
 * Uses Node.js built-in `crypto` for JWT (HS256) and password hashing (scrypt).
 */
import { createHmac, randomBytes, timingSafeEqual, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

const scrypt = promisify(_scrypt);
const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production-min-32-chars';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER' | 'GUEST';

export interface JwtPayload {
  sub:   string;
  email: string;
  role:  UserRole;
  iat:   number;
  exp:   number;
}

// ─── HS256 JWT (Node.js crypto) ───────────────────────────────────────────────

function b64url(s: string)    { return Buffer.from(s).toString('base64url'); }
function b64urlDec(s: string) { return Buffer.from(s, 'base64url').toString('utf8'); }

function hmacSig(header: string, body: string): string {
  return createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
}

function buildJwt(payload: JwtPayload): string {
  const h = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const b = b64url(JSON.stringify(payload));
  return `${h}.${b}.${hmacSig(h, b)}`;
}

export async function signAccessToken(
  payload: Omit<JwtPayload, 'iat' | 'exp'>
): Promise<string> {
  const exp = expiryTimestamp(process.env.JWT_ACCESS_EXPIRY ?? '15m');
  return buildJwt({ ...payload, iat: now(), exp });
}

export async function signRefreshToken(userId: string): Promise<string> {
  const exp = expiryTimestamp(process.env.JWT_REFRESH_EXPIRY ?? '7d');
  return buildJwt({ sub: userId, email: '', role: 'MEMBER', iat: now(), exp });
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [h, b, sig] = parts;
  const expected = Buffer.from(hmacSig(h, b));
  const provided  = Buffer.from(sig);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new Error('Invalid token signature');
  }
  const payload = JSON.parse(b64urlDec(b)) as JwtPayload;
  if (payload.exp < now()) throw new Error('Token has expired');
  return payload;
}

function now() { return Math.floor(Date.now() / 1000); }
function expiryTimestamp(expiry: string): number {
  const m = expiry.match(/^(\d+)(s|m|h|d)$/);
  if (!m) return now() + 900;
  const mult: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return now() + parseInt(m[1], 10) * (mult[m[2]] ?? 60);
}

// ─── Password (scrypt) ────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

export async function comparePassword(password: string, stored: string): Promise<boolean> {
  try {
    const [salt, hash] = stored.split(':');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return timingSafeEqual(derived, Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

// ─── Secure random token ──────────────────────────────────────────────────────

export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

// ─── Request auth guard ───────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message: string, public status = 401) { super(message); }
}

export async function requireAuth(request: NextRequest): Promise<JwtPayload> {
  const auth  = request.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) throw new AuthError('Missing access token', 401);
  try { return await verifyToken(token); }
  catch { throw new AuthError('Invalid or expired access token', 401); }
}

export async function requireAdmin(request: NextRequest): Promise<JwtPayload> {
  const p = await requireAuth(request);
  if (p.role !== 'ADMIN' && p.role !== 'SUPER_ADMIN') throw new AuthError('Insufficient permissions', 403);
  return p;
}

// ─── Session cookie ───────────────────────────────────────────────────────────

export async function setSessionCookie(accessToken: string) {
  const jar = await cookies();
  jar.set('hs_session', accessToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   900,
    path:     '/',
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete('hs_session');
}
