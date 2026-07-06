import { NextRequest, NextResponse } from 'next/server';
import { updateTestSchema } from '@/lib/validators/test.schema';
import { testService } from '@/server/services/test.service';
import { requireRole } from '@/server/auth/rbac';

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireRole('ADMIN');
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = updateTestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const test = await testService.update(id, parsed.data, u.sub);
  return NextResponse.json({ test });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireRole('ADMIN');
  const { id } = await ctx.params;
  await testService.remove(id, u.sub);
  return NextResponse.json({ ok: true });
}
