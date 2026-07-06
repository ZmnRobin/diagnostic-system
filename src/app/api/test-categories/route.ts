import { NextRequest, NextResponse } from 'next/server';
import { testCategorySchema } from '@/lib/validators/test.schema';
import { testService } from '@/server/services/test.service';
import { requireRole } from '@/server/auth/rbac';

export async function GET() {
  await requireRole('ADMIN');
  const categories = await testService.listCategories();
  return NextResponse.json({ categories });
}

export async function POST(req: NextRequest) {
  await requireRole('ADMIN');
  const body = await req.json().catch(() => null);
  const parsed = testCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const category = await testService.createCategory(parsed.data.name);
  return NextResponse.json({ category }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  await requireRole('ADMIN');
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
  await testService.deleteCategory(id);
  return NextResponse.json({ ok: true });
}
