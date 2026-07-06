// Human-friendly IDs like P-2026-00001, INV-2026-00042.
// Always pad to 5 digits; sequence grows within a year.

import { prisma } from '@/server/db';

export async function nextPatientCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `P-${year}-`;
  const last = await prisma.patient.findFirst({
    where: { patientCode: { startsWith: prefix } },
    orderBy: { patientCode: 'desc' },
    select: { patientCode: true },
  });
  const lastSeq = last ? parseInt(last.patientCode.slice(prefix.length), 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(5, '0')}`;
}

export async function nextInvoiceNo(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' },
    select: { invoiceNo: true },
  });
  const lastSeq = last ? parseInt(last.invoiceNo.slice(prefix.length), 10) : 0;
  return `${prefix}${String(lastSeq + 1).padStart(5, '0')}`;
}
