import { NextRequest, NextResponse } from 'next/server';
import { updatePatientSchema } from '@/lib/validators/patient.schema';
import { patientService } from '@/server/services/patient.service';
import { requireRole } from '@/server/auth/rbac';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await requireRole('ADMIN', 'RECEPTION');
  const { id } = await ctx.params;
  const patient = await patientService.details(id);
  if (!patient) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ patient });
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const u = await requireRole('ADMIN', 'RECEPTION');
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const parsed = updatePatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const patient = await patientService.update(id, parsed.data, u.sub);
  return NextResponse.json({ patient });
}
