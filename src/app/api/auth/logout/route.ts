import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/server/auth/session';
import { readSession } from '@/server/auth/session';
import { logAudit } from '@/server/services/audit.service';

export async function POST() {
  const u = await readSession();
  await clearSessionCookie();
  if (u) await logAudit({ userId: u.sub, action: 'USER_LOGOUT' });
  return NextResponse.json({ ok: true });
}
