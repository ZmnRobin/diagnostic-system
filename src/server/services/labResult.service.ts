import { labResultRepo } from '@/server/repositories/labResult.repo';
import { saveDraftSchema, type SaveDraftInput } from '@/lib/validators/labResult.schema';
import { logAudit } from '@/server/services/audit.service';
import { prisma } from '@/server/db';
import { flagRowsForReport } from '@/lib/lab/flag';
import type { RangeEntry, ReportData } from '@/types/domain';

type ActorLike = { sub: string };

function asRangeEntries(json: unknown): RangeEntry[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((e): e is RangeEntry => !!e && typeof e === 'object' && 'analyte' in (e as object))
    .map((e) => ({
      analyte: String((e as RangeEntry).analyte ?? ''),
      unit: (e as RangeEntry).unit ?? '',
      maleRef: (e as RangeEntry).maleRef ?? '',
      femaleRef: (e as RangeEntry).femaleRef ?? '',
      generalRef: (e as RangeEntry).generalRef ?? '',
    }));
}

export class LabResultServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const labResultService = {
  getById(id: string) {
    return labResultRepo.findById(id);
  },

  getByInvoiceItem(invoiceItemId: string) {
    return labResultRepo.findByInvoiceItemId(invoiceItemId);
  },

  listPending() {
    return labResultRepo.listPending();
  },

  listApproved(filter?: { from?: Date; to?: Date }) {
    return labResultRepo.listApproved(filter);
  },

  async upsertDraft(invoiceItemId: string, input: SaveDraftInput, actor: ActorLike) {
    const parsed = saveDraftSchema.safeParse(input);
    if (!parsed.success) {
      throw new LabResultServiceError(
        parsed.error.issues[0]?.message ?? 'Invalid input',
        400,
      );
    }

    // Block editing an already-approved report (Phase 2 rule).
    const existing = await labResultRepo.findByInvoiceItemId(invoiceItemId);
    if (existing && existing.status === 'APPROVED') {
      throw new LabResultServiceError(
        'Result is approved and cannot be edited',
        403,
      );
    }

    const result = await labResultRepo.upsertDraft(
      invoiceItemId,
      actor.sub,
      parsed.data.values as unknown as object,
      parsed.data.comments ?? null,
    );

    await logAudit({
      userId: actor.sub,
      action: 'REPORT_DRAFT_SAVED',
      entity: 'InvoiceItem',
      entityId: invoiceItemId,
      meta: { valueCount: parsed.data.values.length },
    });

    return result;
  },

  async approve(invoiceItemId: string, actor: ActorLike) {
    const existing = await labResultRepo.findByInvoiceItemId(invoiceItemId);
    if (!existing) {
      throw new LabResultServiceError('Result not found', 404);
    }
    if (existing.status === 'APPROVED') {
      throw new LabResultServiceError('Result is already approved', 409);
    }
    if (existing.status !== 'DRAFT') {
      throw new LabResultServiceError('Result is not in a draft state', 409);
    }

    const result = await labResultRepo.markApproved(existing.id, actor.sub);

    await logAudit({
      userId: actor.sub,
      action: 'REPORT_APPROVED',
      entity: 'InvoiceItem',
      entityId: invoiceItemId,
      meta: { approvedById: actor.sub },
    });

    return result;
  },

  async getReportData(invoiceItemId: string): Promise<ReportData | null> {
    const item = await labResultRepo.getReportData(invoiceItemId);
    if (!item) return null;

    const settings = await prisma.setting.findMany();
    const center = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    const ranges = asRangeEntries(item.test.referenceRanges);
    const values = Array.isArray(item.result?.values)
      ? (item.result!.values as Array<{ analyte: string; value: string; unit?: string }>)
      : [];
    const rows = flagRowsForReport(ranges, values, item.invoice.visit.patient.gender);

    return {
      centerName: center.centerName ?? 'Sachar Diagnostic Center',
      centerAddress: center.centerAddress ?? '',
      centerPhone: center.centerPhone ?? '',
      patient: {
        ...item.invoice.visit.patient,
        createdAt: item.invoice.visit.patient.createdAt.toISOString(),
      },
      invoiceNo: item.invoice.invoiceNo,
      invoiceId: item.invoice.id,
      testCode: item.test.code,
      testName: item.test.name,
      categoryName: item.test.category.name,
      collectedAt: item.invoice.createdAt.toISOString(),
      status: item.result?.status ?? 'DRAFT',
      enteredByName: item.result?.enteredBy?.name ?? '—',
      approvedByName: item.result?.approvedBy?.name ?? null,
      approvedAt: item.result?.approvedAt ? item.result.approvedAt.toISOString() : null,
      comments: item.result?.comments ?? null,
      rows,
    };
  },
};