import Link from 'next/link';
import { prisma } from '@/server/db';
import { Card, CardBody, EmptyState } from '@/components/ui/form';
import { formatMoney } from '@/server/utils/money';
import { fmtDateTime } from '@/server/utils/date';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      visit: { include: { patient: true } },
      items: { include: { result: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500">Latest 50 invoices.</p>
        </div>
        <Link
          href="/invoices/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          + New Invoice
        </Link>
      </div>

      <Card>
        <CardBody className="p-0">
          {invoices.length === 0 ? (
            <div className="px-5 py-6">
              <EmptyState
                title="No invoices yet"
                hint="Create one from the Patients page or the button above."
              />
            </div>
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
                {invoices.map((inv) => {
                  const allDone = inv.items.every((i) => i.result?.status === 'APPROVED');
                  const anyDone = inv.items.some((i) => i.result?.status === 'APPROVED');
                  return (
                    <tr key={inv.id}>
                      <td className="px-5 py-2 font-medium text-slate-900">{inv.invoiceNo}</td>
                      <td className="px-5 py-2 text-slate-700">
                        {inv.visit.patient.name}{' '}
                        <span className="text-xs text-slate-500">
                          ({inv.visit.patient.patientCode})
                        </span>
                      </td>
                      <td className="px-5 py-2 text-slate-600">{fmtDateTime(inv.createdAt)}</td>
                      <td className="px-5 py-2 text-right font-medium text-slate-900">
                        {formatMoney(inv.total)}
                      </td>
                      <td className="px-5 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            allDone
                              ? 'bg-green-100 text-green-700'
                              : anyDone
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-sky-100 text-sky-700'
                          }`}
                        >
                          {allDone ? 'Ready' : anyDone ? 'Partial' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-5 py-2 text-right">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-sky-600 hover:underline"
                        >
                          View
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