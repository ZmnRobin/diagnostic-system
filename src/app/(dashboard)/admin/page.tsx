import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSession } from '@/server/auth/session';
import { financeService } from '@/server/services/finance.service';
import { labAnalyticsService } from '@/server/services/labAnalytics.service';
import { formatMoney } from '@/server/utils/money';
import { Card, CardBody, CardHeader, StatCard, EmptyState } from '@/components/ui/form';
import { LabAnalyticsCards } from '@/components/admin/lab-analytics-cards';
import { fmtDate, fmtDateTime } from '@/server/utils/date';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const u = await readSession();
  if (!u) redirect('/login');
  if (u.role !== 'ADMIN') redirect(u.role === 'LAB' ? '/lab' : '/reception');

  const [data, labData] = await Promise.all([
    financeService.dashboard(),
    labAnalyticsService.snapshot(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Today and this month at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/expenses/new"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            + Expense
          </Link>
          <Link
            href="/admin/income/new"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            + Income
          </Link>
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Today</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Income" value={formatMoney(data.today.income)} />
          <StatCard label="Expenses" value={formatMoney(data.today.expenses)} />
          <StatCard label="Profit" value={formatMoney(data.today.profit)} />
          <StatCard label="Patients" value={data.today.visits} hint={`${data.today.invoiceCount} invoices`} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">This month</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Income" value={formatMoney(data.month.income)} />
          <StatCard label="Expenses" value={formatMoney(data.month.expenses)} />
          <StatCard label="Profit" value={formatMoney(data.month.profit)} />
          <StatCard
            label="Patients"
            value={data.month.visits}
            hint={`${data.month.invoiceCount} invoices · ${data.month.manualIncomeCount} manual income`}
          />
        </div>
      </section>

      <LabAnalyticsCards
        topTests={labData.topTestsThisMonth}
        pendingQueue={labData.pendingQueue}
        approvedThisMonth={labData.approvedThisMonth}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Recent activity" subtitle="Audit trail" />
          <CardBody className="p-0">
            {data.recentActivities.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState title="No activity yet" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentActivities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between px-5 py-2.5">
                    <div>
                      <p className="text-sm text-slate-800">
                        <span className="font-medium">{a.user}</span>{' '}
                        <span className="text-slate-500">·</span>{' '}
                        <span className="text-slate-600">{a.action}</span>
                      </p>
                    </div>
                    <span className="text-xs text-slate-500">{fmtDateTime(a.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent expenses" />
          <CardBody className="p-0">
            {data.recentExpenses.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState
                  title="No expenses recorded"
                  hint="Phase 3 will add expense entry."
                />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {data.recentExpenses.map((e) => (
                  <li key={e.id} className="flex items-center justify-between px-5 py-2.5">
                    <div>
                      <p className="text-sm text-slate-800">{e.category}</p>
                      {e.description && <p className="text-xs text-slate-500">{e.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-700">−{formatMoney(e.amount)}</p>
                      <p className="text-xs text-slate-500">{fmtDate(e.date)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total patients" value={data.totalPatients} />
        <StatCard label="Pending reports" value={data.pendingReports} />
      </div>
    </div>
  );
}