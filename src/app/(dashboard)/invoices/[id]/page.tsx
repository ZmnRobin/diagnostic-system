import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/server/db';
import { Card, CardBody } from '@/components/ui/form';
import { PrintButton } from '@/components/ui/print-button';
import { formatMoney } from '@/server/utils/money';
import { fmtDate, fmtDateTime } from '@/server/utils/date';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { id } = await params;
  const { print } = await searchParams;
  const inv = await prisma.invoice.findUnique({
    where: { id },
    include: {
      visit: { include: { patient: true } },
      createdBy: { select: { name: true } },
      items: { include: { test: true, result: true } },
    },
  });
  if (!inv) notFound();

  const settings = await prisma.setting.findMany();
  const center = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  const centerName = center.centerName ?? 'Sachar Diagnostic Center';
  const centerAddress = center.centerAddress ?? '';
  const centerPhone = center.centerPhone ?? '';

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Invoice {inv.invoiceNo}</h1>
            <p className="text-sm text-slate-500">
              {fmtDateTime(inv.createdAt)} · Created by {inv.createdBy?.name ?? '—'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/invoices"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Back
            </Link>
            <PrintButton />
          </div>
        </div>

        <Card className="print:shadow-none print:border-0">
          <CardBody>
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-semibold text-slate-900">{centerName}</h2>
              {centerAddress && <p className="text-sm text-slate-600">{centerAddress}</p>}
              {centerPhone && <p className="text-sm text-slate-600">Phone: {centerPhone}</p>}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Invoice</p>
                <p className="font-semibold text-slate-900">{inv.invoiceNo}</p>
                <p className="text-slate-600">{fmtDate(inv.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
                <p className="font-semibold text-slate-900">{inv.visit.patient.name}</p>
                <p className="text-slate-600">
                  {inv.visit.patient.patientCode} · {inv.visit.patient.age}{' '}
                  {inv.visit.patient.ageUnit.toLowerCase()} · {inv.visit.patient.gender}
                </p>
                <p className="text-slate-600">{inv.visit.patient.mobile}</p>
              </div>
            </div>

            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2">Code</th>
                  <th className="py-2">Test</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inv.items.map((i) => (
                  <tr key={i.id}>
                    <td className="py-2 font-mono text-xs text-slate-600">{i.test.code}</td>
                    <td className="py-2 text-slate-900">{i.test.name}</td>
                    <td className="py-2 text-right text-slate-900">
                      {formatMoney(i.priceAtBilling)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="text-slate-900">{formatMoney(inv.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="text-slate-900">− {formatMoney(inv.discount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 text-base font-semibold">
                <span>Total</span>
                <span>{formatMoney(inv.total)}</span>
              </div>
              <div className="flex justify-between pt-1 text-xs text-slate-500">
                <span>Payment</span>
                <span>{inv.paymentMethod}</span>
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-slate-400">
              Thank you for visiting {centerName}.
            </p>
          </CardBody>
        </Card>

        {print === '1' && (
          <script
            // Auto-trigger print when redirected after creation
            dangerouslySetInnerHTML={{
              __html: 'setTimeout(()=>window.print(), 600);',
            }}
          />
        )}
      </div>
    </>
  );
}