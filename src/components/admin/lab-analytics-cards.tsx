import Link from 'next/link';
import { Card, CardBody, CardHeader, StatCard, EmptyState } from '@/components/ui/form';
import { fmtDateTime } from '@/server/utils/date';

type PendingRow = {
  invoiceItemId: string;
  patientName: string;
  patientCode: string;
  testName: string;
  testCode: string;
  receivedAt: Date;
};

export function LabAnalyticsCards({
  topTests,
  pendingQueue,
  approvedThisMonth,
}: {
  topTests: Array<{ testId: string; testName: string; code: string; count: number }>;
  pendingQueue: PendingRow[];
  approvedThisMonth: number;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Lab analytics
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Top tests this month" subtitle="By approved reports" />
          <CardBody className="p-0">
            {topTests.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState title="No approved reports yet this month" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2">Test</th>
                    <th className="px-5 py-2 text-right">Approved</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topTests.map((t) => (
                    <tr key={t.testId}>
                      <td className="px-5 py-2">
                        <div className="font-medium text-slate-900">{t.testName}</div>
                        <div className="font-mono text-xs text-slate-500">{t.code}</div>
                      </td>
                      <td className="px-5 py-2 text-right font-semibold text-slate-900">
                        {t.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Approval pending"
            subtitle={`${pendingQueue.length} item(s) waiting`}
            action={
              <Link
                href="/lab"
                className="text-xs font-medium text-sky-600 hover:underline"
              >
                Open lab →
              </Link>
            }
          />
          <CardBody className="p-0">
            {pendingQueue.length === 0 ? (
              <div className="px-5 py-6">
                <EmptyState title="No pending approvals" />
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {pendingQueue.map((r) => (
                  <li key={r.invoiceItemId} className="px-5 py-2">
                    <Link
                      href={`/lab/results/${r.invoiceItemId}`}
                      className="flex items-center justify-between hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{r.testName}</p>
                        <p className="text-xs text-slate-500">
                          {r.patientName}{' '}
                          <span className="text-slate-400">({r.patientCode})</span>
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {fmtDateTime(r.receivedAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-4">
          <StatCard label="Approved this month" value={approvedThisMonth} hint="Finalized lab reports" />
          <StatCard label="Doctor-wise revenue" value="—" hint="Available in Phase 3" />
        </div>
      </div>
    </section>
  );
}