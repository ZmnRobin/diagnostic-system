import { NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/rbac';
import { labResultService } from '@/server/services/labResult.service';

export async function GET() {
  await requireRole('LAB');
  const results = await labResultService.listPending();
  return NextResponse.json({ results });
}