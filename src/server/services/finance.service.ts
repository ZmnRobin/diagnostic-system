import { prisma } from '@/server/db';
import { todayRange, monthRange, type Range } from '@/server/utils/date';

async function totalsForRange(range: Range) {
  const [invoiceAgg, manualIncome, expenses, visitCount] = await Promise.all([
    prisma.invoice.aggregate({
      where: { createdAt: { gte: range.from, lte: range.to } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.manualIncome.aggregate({
      where: { date: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where: { date: { gte: range.from, lte: range.to } },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.visit.count({ where: { createdAt: { gte: range.from, lte: range.to } } }),
  ]);

  const invoiceIncome = Number(invoiceAgg._sum.total ?? 0);
  const manualTotal = Number(manualIncome._sum.amount ?? 0);
  const expenseTotal = Number(expenses._sum.amount ?? 0);

  return {
    invoiceIncome: invoiceIncome.toFixed(2),
    manualIncome: manualTotal.toFixed(2),
    income: (invoiceIncome + manualTotal).toFixed(2),
    expenses: expenseTotal.toFixed(2),
    profit: (invoiceIncome + manualTotal - expenseTotal).toFixed(2),
    invoiceCount: invoiceAgg._count,
    manualIncomeCount: manualIncome._count,
    expenseCount: expenses._count,
    visits: visitCount,
  };
}

export const financeService = {
  async dashboard() {
    const today = await totalsForRange(todayRange());
    const month = await totalsForRange(monthRange());

    const [pendingReports, totalPatients, recentActivities, recentExpenses] = await Promise.all([
      prisma.labResult.count({ where: { status: 'DRAFT' } }),
      prisma.patient.count(),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { name: true, username: true } } },
      }),
      prisma.expense.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { createdBy: { select: { name: true } } },
      }),
    ]);

    return {
      today,
      month,
      pendingReports,
      totalPatients,
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        action: a.action,
        createdAt: a.createdAt,
        user: a.user?.name ?? 'system',
      })),
      recentExpenses: recentExpenses.map((e) => ({
        id: e.id,
        date: e.date,
        category: e.category,
        amount: e.amount.toString(),
        description: e.description,
        createdBy: e.createdBy?.name ?? '',
      })),
    };
  },

  async cashBook() {
    const [invoices, manual, expenses] = await Promise.all([
      prisma.invoice.findMany({
        select: { id: true, invoiceNo: true, total: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.manualIncome.findMany({
        orderBy: { date: 'asc' },
      }),
      prisma.expense.findMany({
        orderBy: { date: 'asc' },
      }),
    ]);

    type Entry = { date: Date; type: 'INVOICE' | 'INCOME' | 'EXPENSE'; description: string; amount: number; id: string };
    const entries: Entry[] = [];
    for (const i of invoices)
      entries.push({
        date: i.createdAt,
        type: 'INVOICE',
        description: `${i.invoiceNo} — Invoice`,
        amount: Number(i.total),
        id: i.id,
      });
    for (const m of manual)
      entries.push({
        date: m.date,
        type: 'INCOME',
        description: `${m.category} — ${m.description ?? ''}`.trim(),
        amount: Number(m.amount),
        id: m.id,
      });
    for (const e of expenses)
      entries.push({
        date: e.date,
        type: 'EXPENSE',
        description: `${e.category} — ${e.description ?? ''}`.trim(),
        amount: -Number(e.amount),
        id: e.id,
      });

    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    let balance = 0;
    const ledger = entries.map((entry) => {
      balance += entry.amount;
      return { ...entry, balance };
    });
    return ledger;
  },

  async report(range: Range) {
    return totalsForRange(range);
  },
};
