import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { verifyPassword } from '@/server/auth/password';
import { issueSession, setSessionCookie } from '@/server/auth/session';
import { logAudit } from '@/server/services/audit.service';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (!user || !user.isActive) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await issueSession({
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role as 'ADMIN' | 'RECEPTION' | 'LAB',
  });
  await setSessionCookie(token);
  await logAudit({ userId: user.id, action: 'USER_LOGIN' });

  return NextResponse.json({
    user: { id: user.id, username: user.username, name: user.name, role: user.role },
  });
}
