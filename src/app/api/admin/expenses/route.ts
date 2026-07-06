import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/rbac';
import { financeEntryService, FinanceServiceError } from '@/server/services/finance-entry.service';
import { todayRange } from '@/server/utils/date';

export async function GET() {
  await requireRole('ADMIN');
  const { from, to } = todayRange();
  const expenses = await financeEntryService.listTodayExpenses(from, to);
  return NextResponse.json({ expenses });
}

export async function POST(req: NextRequest) {
  const u = await requireRole('ADMIN');
  const body = await req.json().catch(() => null);
  try {
    const expense = await financeEntryService.createExpense(body, u.sub);
    return NextResponse.json({ expense }, { status: 201 });
  } catch (err) {
    if (err instanceof FinanceServiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json(
      { error: (err as Error).message ?? 'Server error' },
      { status: 500 },
    );
  }
}