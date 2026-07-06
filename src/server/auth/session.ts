import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'sachar_session';
const TTL = Number(process.env.SESSION_TTL_SECONDS ?? 28800);

function getSecret(): Uint8Array {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16) {
    throw new Error('JWT_SECRET is missing or too short (set it in .env)');
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = JWTPayload & {
  sub: string;
  username: string;
  name: string;
  role: 'ADMIN' | 'RECEPTION' | 'LAB';
};

export async function issueSession(payload: SessionPayload): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return await new SignJWT({
    username: payload.username,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(now)
    .setExpirationTime(now + TTL)
    .setSubject(payload.sub)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.sub || !payload.username || !payload.role) return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TTL,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function readSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
