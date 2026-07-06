import { prisma } from '@/server/db';
import type { Prisma } from '@prisma/client';

export const expenseRepo = {
  listToday(from: Date, to: Date) {
    return prisma.expense.findMany({
      where: { date: { gte: from, lte: to } },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },
  listRecent(take = 30) {
    return prisma.expense.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take,
    });
  },
  create(data: Prisma.ExpenseCreateInput) {
    return prisma.expense.create({ data });
  },
};

export const manualIncomeRepo = {
  listToday(from: Date, to: Date) {
    return prisma.manualIncome.findMany({
      where: { date: { gte: from, lte: to } },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },
  listRecent(take = 30) {
    return prisma.manualIncome.findMany({
      include: { createdBy: { select: { name: true } } },
      orderBy: { date: 'desc' },
      take,
    });
  },
  create(data: Prisma.ManualIncomeCreateInput) {
    return prisma.manualIncome.create({ data });
  },
};