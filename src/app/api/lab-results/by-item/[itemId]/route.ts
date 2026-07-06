import { NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/rbac';
import { labResultService } from '@/server/services/labResult.service';

export async function GET(_req: Request, ctx: { params: Promise<{ itemId: string }> }) {
  await requireRole('LAB');
  const { itemId } = await ctx.params;
  const result = await labResultService.getByInvoiceItem(itemId);
  if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ result });
}