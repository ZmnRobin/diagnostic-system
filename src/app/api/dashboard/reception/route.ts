import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { requireRole } from '@/server/auth/rbac';
import { todayRange } from '@/server/utils/date';

export async function GET() {
  await requireRole('RECEPTION');
  const { from, to } = todayRange();

  const [patientsToday, pendingReports, invoicesToday] = await Promise.all([
    prisma.visit.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.labResult.count({ where: { status: 'DRAFT' } }),
    prisma.invoice.aggregate({
      where: { createdAt: { gte: from, lte: to } },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    patientsToday,
    pendingReports,
    invoiceCountToday: invoicesToday._count,
    incomeToday: invoicesToday._sum.total ?? '0.00',
  });
}
