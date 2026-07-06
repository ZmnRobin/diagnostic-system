import { expenseRepo, manualIncomeRepo } from '@/server/repositories/finance.repo';
import { expenseSchema, manualIncomeSchema } from '@/lib/validators/finance.schema';
import { logAudit } from '@/server/services/audit.service';

export class FinanceServiceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const financeEntryService = {
  async createExpense(input: unknown, actorUserId: string) {
    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) {
      throw new FinanceServiceError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }
    const expense = await expenseRepo.create({
      date: parsed.data.date,
      category: parsed.data.category,
      amount: parsed.data.amount.toFixed(2),
      description: parsed.data.description ?? null,
      createdBy: { connect: { id: actorUserId } },
    });
    await logAudit({
      userId: actorUserId,
      action: 'EXPENSE_CREATED',
      entity: 'Expense',
      entityId: expense.id,
      meta: { category: expense.category, amount: expense.amount },
    });
    return expense;
  },

  async createManualIncome(input: unknown, actorUserId: string) {
    const parsed = manualIncomeSchema.safeParse(input);
    if (!parsed.success) {
      throw new FinanceServiceError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }
    const income = await manualIncomeRepo.create({
      date: parsed.data.date,
      category: parsed.data.category,
      amount: parsed.data.amount.toFixed(2),
      description: parsed.data.description ?? null,
      createdBy: { connect: { id: actorUserId } },
    });
    await logAudit({
      userId: actorUserId,
      action: 'INCOME_CREATED',
      entity: 'ManualIncome',
      entityId: income.id,
      meta: { category: income.category, amount: income.amount },
    });
    return income;
  },

  listTodayExpenses(from: Date, to: Date) {
    return expenseRepo.listToday(from, to);
  },

  listTodayIncome(from: Date, to: Date) {
    return manualIncomeRepo.listToday(from, to);
  },
};