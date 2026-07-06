import { NextRequest, NextResponse } from 'next/server';
import { invoiceService } from '@/server/services/invoice.service';
import { requireRole } from '@/server/auth/rbac';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN', 'RECEPTION');
  const { id } = await ctx.params;
  const invoice = await invoiceService.get(id);
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ invoice });
}
