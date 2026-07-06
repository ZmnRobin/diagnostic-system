import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { requireRole } from '@/server/auth/rbac';

export async function GET() {
  await requireRole('LAB');
  const [pending, approved] = await Promise.all([
    prisma.labResult.count({ where: { status: 'DRAFT' } }),
    prisma.labResult.count({ where: { status: 'APPROVED' } }),
  ]);
  return NextResponse.json({ pending, completed: approved });
}
