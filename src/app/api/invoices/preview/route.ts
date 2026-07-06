import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { invoiceService } from '@/server/services/invoice.service';
import { requireRole } from '@/server/auth/rbac';

const schema = z.object({
  testIds: z.array(z.string().min(1)),
  discount: z.coerce.number().min(0).default(0),
});

export async function POST(req: NextRequest) {
  await requireRole('ADMIN', 'RECEPTION');
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  const totals = await invoiceService.calculateTotals(parsed.data.testIds, parsed.data.discount);
  return NextResponse.json(totals);
}
