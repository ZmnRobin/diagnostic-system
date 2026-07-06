import { readSession, type SessionPayload } from './session';

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

export async function getCurrentUser(): Promise<SessionPayload | null> {
  return readSession();
}

export async function requireUser(): Promise<SessionPayload> {
  const u = await readSession();
  if (!u) throw new AuthError('Not authenticated', 401);
  return u;
}

export async function requireRole(...roles: SessionPayload['role'][]): Promise<SessionPayload> {
  const u = await requireUser();
  if (!roles.includes(u.role)) throw new AuthError('Forbidden', 403);
  return u;
}
