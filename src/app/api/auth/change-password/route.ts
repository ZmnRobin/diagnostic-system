import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { requireUser } from '@/server/auth/rbac';
import { logAudit } from '@/server/services/audit.service';

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export async function POST(req: NextRequest) {
  const u = await requireUser();
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: u.sub } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const ok = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });

  await prisma.user.update({
    where: { id: u.sub },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
  await logAudit({ userId: u.sub, action: 'PASSWORD_CHANGED' });

  return NextResponse.json({ ok: true });
}
