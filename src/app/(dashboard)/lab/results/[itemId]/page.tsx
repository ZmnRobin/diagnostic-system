import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { readSession } from '@/server/auth/session';
import { prisma } from '@/server/db';
import { Card, CardBody, Badge } from '@/components/ui/form';
import { ResultEntryForm } from '@/components/lab/result-entry-form';
import { ApproveButton } from '@/components/lab/approve-button';
import { fmtDateTime } from '@/server/utils/date';
import type { RangeEntry, ResultValueEntry } from '@/types/domain';

export const dynamic = 'force-dynamic';

function asRangeEntries(json: unknown): RangeEntry[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((e): e is RangeEntry => !!e && typeof e === 'object' && 'analyte' in (e as object))
    .map((e) => ({
      analyte: String((e as RangeEntry).analyte ?? ''),
      unit: (e as RangeEntry).unit ?? '',
      maleRef: (e as RangeEntry).maleRef ?? '',
      femaleRef: (e as RangeEntry).femaleRef ?? '',
      generalRef: (e as RangeEntry).generalRef ?? '',
    }));
}

export default async function ResultEntryPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const u = await readSession();
  if (!u) redirect('/login');
  if (u.role !== 'LAB') redirect(u.role === 'ADMIN' ? '/admin' : '/reception');

  const { itemId } = await params;
  const item = await prisma.invoiceItem.findUnique({
    where: { id: itemId },
    include: {
      test: { include: { category: true } },
      invoice: { include: { visit: { include: { patient: true } } } },
      result: true,
    },
  });
  if (!item) notFound();

  const ranges = asRangeEntries(item.test.referenceRanges);
  const result = item.result;
  const isApproved = result?.status === 'APPROVED';

  const initialValues: ResultValueEntry[] = Array.isArray(result?.values)
    ? (result!.values as ResultValueEntry[])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">{item.test.name}</h1>
            {result && (
              <Badge tone={isApproved ? 'success' : 'warning'}>
                {result.status}
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {item.test.code} · {item.test.category.name} · Invoice{' '}
            <Link href={`/invoices/${item.invoice.id}`} className="text-sky-600 hover:underline">
              {item.invoice.invoiceNo}
            </Link>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/lab"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Back
          </Link>
          {isApproved && (
            <Link
              href={`/reports/${item.id}`}
              className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
            >
              Open printable report →
            </Link>
          )}
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
              <p className="font-medium text-slate-900">
                {item.invoice.visit.patient.name}
              </p>
              <p className="text-xs text-slate-500">
                {item.invoice.visit.patient.patientCode}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Age / Gender</p>
              <p className="font-medium text-slate-900">
                {item.invoice.visit.patient.age}{' '}
                {item.invoice.visit.patient.ageUnit.toLowerCase()} ·{' '}
                {item.invoice.visit.patient.gender}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Mobile</p>
              <p className="font-medium text-slate-900">
                {item.invoice.visit.patient.mobile}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Billed</p>
              <p className="font-medium text-slate-900">
                {fmtDateTime(item.invoice.createdAt)}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <ResultEntryForm
        invoiceItemId={item.id}
        ranges={ranges}
        initialValues={initialValues.map((v) => ({ analyte: v.analyte, value: v.value }))}
        initialComments={result?.comments ?? ''}
        readOnly={isApproved}
        patientGender={item.invoice.visit.patient.gender}
      />

      {!isApproved && result && (
        <ApproveControls invoiceItemId={item.id} hasValues={initialValues.length > 0} />
      )}
    </div>
  );
}

function ApproveControls({
  invoiceItemId,
  hasValues,
}: {
  invoiceItemId: string;
  hasValues: boolean;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Ready to finalize?</p>
            <p className="text-xs text-slate-500">
              Approval is final and locks the report from further edits.
            </p>
          </div>
          <ApproveButton invoiceItemId={invoiceItemId} disabled={!hasValues} />
        </div>
      </CardBody>
    </Card>
  );
}