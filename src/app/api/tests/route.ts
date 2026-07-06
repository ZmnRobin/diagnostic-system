import { NextRequest, NextResponse } from 'next/server';
import { createTestSchema } from '@/lib/validators/test.schema';
import { testService } from '@/server/services/test.service';
import { requireRole } from '@/server/auth/rbac';

export async function GET(req: NextRequest) {
  await requireRole('ADMIN');
  const q = req.nextUrl.searchParams.get('q') ?? undefined;
  const includeInactive = req.nextUrl.searchParams.get('includeInactive') === '1';
  const categoryId = req.nextUrl.searchParams.get('categoryId') ?? undefined;
  const tests = await testService.list(q, includeInactive, categoryId);
  return NextResponse.json({ tests });
}

export async function POST(req: NextRequest) {
  const u = await requireRole('ADMIN');
  const body = await req.json().catch(() => null);
  const parsed = createTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const test = await testService.create(parsed.data, u.sub);
  return NextResponse.json({ test }, { status: 201 });
}
