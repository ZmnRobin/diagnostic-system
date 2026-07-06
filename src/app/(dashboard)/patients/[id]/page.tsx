import Link from 'next/link';
import { notFound } from 'next/navigation';
import { patientRepo } from '@/server/repositories/patient.repo';
import { Card, CardBody, CardHeader, EmptyState } from '@/components/ui/form';
import { formatMoney } from '@/server/utils/money';
import { fmtDateTime } from '@/server/utils/date';

export const dynamic = 'force-dynamic';

export default async function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patient = await patientRepo.withVisitHistory(id);
  if (!patient) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
          <h1 className="text-2xl font-semibold text-slate-900">{patient.name}</h1>
          <p className="font-mono text-xs text-slate-500">{patient.patientCode}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/invoices/new?patientId=${patient.id}`}
            className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            + New Invoice
          </Link>
          <Link
            href="/patients"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Back
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader title="Profile" />
        <CardBody>
          <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-slate-500">Age</dt>
              <dd className="text-slate-900">
                {patient.age} {patient.ageUnit.toLowerCase()}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Gender</dt>
              <dd className="text-slate-900">{patient.gender}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Mobile</dt>
              <dd className="text-slate-900">{patient.mobile}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Address</dt>
              <dd className="text-slate-900">{patient.address ?? '—'}</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Visit history" subtitle="All invoices ever issued" />
        <CardBody className="p-0">
          {patient.visits.length === 0 ? (
            <div className="px-5 py-6">
              <EmptyState title="No visits yet" hint="Create an invoice to start." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {patient.visits.flatMap((v) =>
                v.invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{inv.invoiceNo}</p>
                      <p className="text-xs text-slate-500">{fmtDateTime(inv.createdAt)}</p>
                      <p className="mt-1 text-xs text-slate-600">
                        {inv.items.map((i) => i.test.name).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatMoney(inv.total)}</p>
                        <p className="text-xs text-slate-500">{inv.items.length} test(s)</p>
                      </div>
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="text-sm text-sky-600 hover:underline"
                      >
                        Open
                      </Link>
                    </div>
                  </li>
                )),
              )}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}