import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/rbac';
import { labResultService } from '@/server/services/labResult.service';

export async function GET(req: NextRequest) {
  await requireRole('LAB');
  const fromStr = req.nextUrl.searchParams.get('from');
  const toStr = req.nextUrl.searchParams.get('to');
  const filter: { from?: Date; to?: Date } = {};
  if (fromStr) filter.from = new Date(fromStr);
  if (toStr) filter.to = new Date(toStr);
  const results = await labResultService.listApproved(filter);
  return NextResponse.json({ results });
}