import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readSession } from '@/server/auth/session';
import { Card, CardBody, CardHeader, StatCard, EmptyState } from '@/components/ui/form';
import { prisma } from '@/server/db';
import { fmtDateTime } from '@/server/utils/date';

export const dynamic = 'force-dynamic';

export default async function LabDashboard() {
  const u = await readSession();
  if (!u) redirect('/login');
  if (u.role !== 'LAB') redirect(u.role === 'ADMIN' ? '/admin' : '/reception');

  const [pendingCount, approvedCount, pendingList] = await Promise.all([
    prisma.labResult.count({ where: { status: 'DRAFT' } }),
    prisma.labResult.count({ where: { status: 'APPROVED' } }),
    prisma.labResult.findMany({
      where: { status: 'DRAFT' },
      take: 20,
      orderBy: { createdAt: 'asc' },
      include: {
        invoiceItem: {
          include: {
            test: { include: { category: true } },
            invoice: {
              include: { visit: { include: { patient: true } } },
            },
          },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Laboratory</h1>
        <p className="text-sm text-slate-500">Pending tests and recent reports.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard label="Pending tests" value={pendingCount} hint="Awaiting result entry or approval" />
        <StatCard label="Reports approved" value={approvedCount} hint="All-time" />
      </div>

      <Card>
        <CardHeader title="Pending queue" subtitle="Oldest first" />
        <CardBody className="p-0">
          {pendingList.length === 0 ? (
            <div className="px-5 py-6">
              <EmptyState title="No pending tests" hint="New tests will appear here." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2">Patient</th>
                  <th className="px-5 py-2">Test</th>
                  <th className="px-5 py-2">Invoice</th>
                  <th className="px-5 py-2">Received</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingList.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-5 py-2 text-slate-800">
                      {r.invoiceItem.invoice.visit.patient.name}{' '}
                      <span className="text-xs text-slate-500">
                        ({r.invoiceItem.invoice.visit.patient.patientCode})
                      </span>
                    </td>
                    <td className="px-5 py-2">
                      <div className="font-medium text-slate-900">{r.invoiceItem.test.name}</div>
                      <div className="text-xs text-slate-500">{r.invoiceItem.test.category.name}</div>
                    </td>
                    <td className="px-5 py-2 text-slate-600">
                      <Link
                        href={`/invoices/${r.invoiceItem.invoice.id}`}
                        className="text-sky-600 hover:underline"
                      >
                        {r.invoiceItem.invoice.invoiceNo}
                      </Link>
                    </td>
                    <td className="px-5 py-2 text-slate-600">{fmtDateTime(r.createdAt)}</td>
                    <td className="px-5 py-2 text-right">
                      <Link
                        href={`/lab/results/${r.invoiceItem.id}`}
                        className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                      >
                        Enter result →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      <p className="text-xs text-slate-500">
        Tip: approved reports are read-only — to issue a corrected report, create a new invoice for the test.
      </p>
    </div>
  );
}