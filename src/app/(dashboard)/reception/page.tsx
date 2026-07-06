import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSession } from '@/server/auth/session';
import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/form';
import { prisma } from '@/server/db';
import { formatMoney } from '@/server/utils/money';
import { fmtDateTime } from '@/server/utils/date';

export const dynamic = 'force-dynamic';

export default async function ReceptionDashboard() {
  const u = await readSession();
  if (!u) redirect('/login');
  if (u.role !== 'RECEPTION') redirect(u.role === 'ADMIN' ? '/admin' : '/lab');

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const [visitsToday, pending, todayAgg, recentInvoices] = await Promise.all([
    prisma.visit.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.labResult.count({ where: { status: 'DRAFT' } }),
    prisma.invoice.aggregate({
      where: { createdAt: { gte: from, lte: to } },
      _sum: { total: true },
      _count: true,
    }),
    prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: { visit: { include: { patient: true } }, items: { include: { result: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Reception</h1>
        <div className="flex gap-2">
          <Link
            href="/invoices/new"
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            + New Invoice
          </Link>
          <Link
            href="/patients/new"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            + New Patient
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Patients today" value={visitsToday} hint="Unique visits" />
        <StatCard label="Pending reports" value={pending} hint="Awaiting lab completion" />
        <StatCard
          label="Income today"
          value={formatMoney(todayAgg._sum.total ?? 0)}
          hint={`${todayAgg._count} invoice(s)`}
        />
      </div>

      <Card>
        <CardHeader title="Recent invoices" subtitle="Latest activity" />
        <CardBody className="p-0">
          {recentInvoices.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-500">No invoices yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2">Invoice</th>
                  <th className="px-5 py-2">Patient</th>
                  <th className="px-5 py-2">Date</th>
                  <th className="px-5 py-2 text-right">Total</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => {
                  const allDone = inv.items.every((i) => i.result?.status === 'APPROVED');
                  const anyDone = inv.items.some((i) => i.result?.status === 'APPROVED');
                  const status = allDone
                    ? { label: 'Ready', tone: 'success' as const }
                    : anyDone
                      ? { label: 'Partial', tone: 'warning' as const }
                      : { label: 'Pending', tone: 'info' as const };
                  return (
                    <tr key={inv.id}>
                      <td className="px-5 py-2 font-medium text-slate-900">{inv.invoiceNo}</td>
                      <td className="px-5 py-2 text-slate-700">
                        {inv.visit.patient.name}{' '}
                        <span className="text-xs text-slate-500">({inv.visit.patient.patientCode})</span>
                      </td>
                      <td className="px-5 py-2 text-slate-600">{fmtDateTime(inv.createdAt)}</td>
                      <td className="px-5 py-2 text-right font-medium text-slate-900">
                        {formatMoney(inv.total)}
                      </td>
                      <td className="px-5 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            status.tone === 'success'
                              ? 'bg-green-100 text-green-700'
                              : status.tone === 'warning'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-sky-600 hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}