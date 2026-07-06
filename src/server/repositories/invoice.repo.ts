import { prisma } from '@/server/db';
import type { Prisma } from '@prisma/client';

export const invoiceRepo = {
  create(data: Prisma.InvoiceCreateInput) {
    return prisma.invoice.create({ data });
  },
  findById(id: string) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        visit: { include: { patient: true } },
        createdBy: { select: { id: true, name: true, username: true } },
        items: { include: { test: true, result: true } },
      },
    });
  },
  list(filter?: { from?: Date; to?: Date }) {
    return prisma.invoice.findMany({
      where: {
        createdAt: filter?.from || filter?.to ? { gte: filter.from, lte: filter.to } : undefined,
      },
      include: {
        visit: { include: { patient: true } },
        items: { include: { test: true, result: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },
  sumTotal(range: { from: Date; to: Date }) {
    return prisma.invoice.aggregate({
      where: { createdAt: { gte: range.from, lte: range.to } },
      _sum: { total: true, subtotal: true, discount: true },
      _count: true,
    });
  },
};

export const visitRepo = {
  create(data: Prisma.VisitCreateInput) {
    return prisma.visit.create({ data });
  },
};
