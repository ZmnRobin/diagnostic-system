import { prisma } from '@/server/db';
import type { Prisma } from '@prisma/client';

const pendingInclude = {
  invoiceItem: {
    include: {
      test: { include: { category: true } },
      invoice: {
        include: { visit: { include: { patient: true } } },
      },
    },
  },
} satisfies Prisma.LabResultInclude;

const fullInclude = {
  invoiceItem: {
    include: {
      test: true,
      invoice: { include: { visit: { include: { patient: true } } } },
    },
  },
  enteredBy: { select: { id: true, name: true } },
  approvedBy: { select: { id: true, name: true } },
} satisfies Prisma.LabResultInclude;

export const labResultRepo = {
  findByInvoiceItemId(invoiceItemId: string) {
    return prisma.labResult.findUnique({
      where: { invoiceItemId },
      include: fullInclude,
    });
  },

  findById(id: string) {
    return prisma.labResult.findUnique({
      where: { id },
      include: fullInclude,
    });
  },

  listPending() {
    return prisma.labResult.findMany({
      where: { status: 'DRAFT' },
      include: pendingInclude,
      orderBy: { createdAt: 'asc' },
    });
  },

  listApproved(filter?: { from?: Date; to?: Date }) {
    const where: Prisma.LabResultWhereInput = {
      status: 'APPROVED',
      ...(filter?.from || filter?.to
        ? { approvedAt: { gte: filter.from, lte: filter.to } }
        : {}),
    };
    return prisma.labResult.findMany({
      where,
      include: fullInclude,
      orderBy: { approvedAt: 'desc' },
      take: 200,
    });
  },

  countPending() {
    return prisma.labResult.count({ where: { status: 'DRAFT' } });
  },

  async upsertDraft(
    invoiceItemId: string,
    enteredById: string,
    values: Prisma.InputJsonValue,
    comments: string | null,
  ) {
    return prisma.labResult.upsert({
      where: { invoiceItemId },
      create: {
        invoiceItemId,
        enteredById,
        status: 'DRAFT',
        values,
        comments,
      },
      update: {
        // Status intentionally NOT reset; the service layer enforces state.
        values,
        comments,
      },
      include: fullInclude,
    });
  },

  markApproved(id: string, approvedById: string) {
    return prisma.labResult.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById,
        approvedAt: new Date(),
      },
      include: fullInclude,
    });
  },

  getReportData(invoiceItemId: string) {
    return prisma.invoiceItem.findUnique({
      where: { id: invoiceItemId },
      include: {
        test: { include: { category: true } },
        invoice: { include: { visit: { include: { patient: true } } } },
        result: {
          include: {
            enteredBy: { select: { id: true, name: true } },
            approvedBy: { select: { id: true, name: true } },
          },
        },
      },
    });
  },

  async countByTestThisMonth(from: Date, to: Date) {
    // Count approved LabResults grouped by test within the given range.
    const rows = await prisma.labResult.findMany({
      where: {
        status: 'APPROVED',
        approvedAt: { gte: from, lte: to },
      },
      select: {
        invoiceItem: {
          select: {
            testId: true,
            test: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });
    const map = new Map<string, { testId: string; testName: string; code: string; count: number }>();
    for (const r of rows) {
      const t = r.invoiceItem.test;
      const existing = map.get(t.id);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(t.id, { testId: t.id, testName: t.name, code: t.code, count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  },

  // Kept as a thin alias for the existing /lab page and any other callers
  // that imported labResultRepo from invoice.repo.ts.
  listForLab() {
    return this.listPending();
  },
};