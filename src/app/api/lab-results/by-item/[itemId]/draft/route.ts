import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/rbac';
import { labResultService, LabResultServiceError } from '@/server/services/labResult.service';

export async function POST(req: NextRequest, ctx: { params: Promise<{ itemId: string }> }) {
  const u = await requireRole('LAB');
  const { itemId } = await ctx.params;
  const body = await req.json().catch(() => null);
  try {
    const result = await labResultService.upsertDraft(itemId, body, { sub: u.sub });
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof LabResultServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: (err as Error).message ?? 'Server error' },
      { status: 500 },
    );
  }
}