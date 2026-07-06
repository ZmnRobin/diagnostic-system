import { NextResponse } from 'next/server';
import { financeService } from '@/server/services/finance.service';
import { requireRole } from '@/server/auth/rbac';

export async function GET() {
  await requireRole('ADMIN');
  const data = await financeService.dashboard();
  return NextResponse.json(data);
}
