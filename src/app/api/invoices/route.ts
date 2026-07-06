import { NextRequest, NextResponse } from 'next/server';
import { createInvoiceSchema, invoiceService } from '@/server/services/invoice.service';
import { requireRole } from '@/server/auth/rbac';

export async function GET() {
  await requireRole('ADMIN', 'RECEPTION');
  const invoices = await invoiceService.list();
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  const u = await requireRole('ADMIN', 'RECEPTION');
  const body = await req.json().catch(() => null);
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  try {
    const invoice = await invoiceService.create(parsed.data, u.sub);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
