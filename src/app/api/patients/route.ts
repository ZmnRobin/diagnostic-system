import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createPatientSchema } from '@/lib/validators/patient.schema';
import { patientService } from '@/server/services/patient.service';
import { requireRole } from '@/server/auth/rbac';

export async function GET(req: NextRequest) {
  await requireRole('ADMIN', 'RECEPTION');
  const q = req.nextUrl.searchParams.get('q') ?? undefined;
  const patients = await patientService.search(q);
  return NextResponse.json({ patients });
}

export async function POST(req: NextRequest) {
  const u = await requireRole('ADMIN', 'RECEPTION');
  const body = await req.json().catch(() => null);
  const parsed = createPatientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const patient = await patientService.create(parsed.data, u.sub);
  return NextResponse.json({ patient }, { status: 201 });
}
