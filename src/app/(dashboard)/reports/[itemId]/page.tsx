import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { readSession } from '@/server/auth/session';
import { Card, CardBody } from '@/components/ui/form';
import { PrintButton } from '@/components/ui/print-button';
import { TestReportTemplate } from '@/components/reports/test-report-template';
import { labResultService } from '@/server/services/labResult.service';

export const dynamic = 'force-dynamic';

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ itemId: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const u = await readSession();
  if (!u) redirect('/login');
  if (u.role !== 'LAB') redirect(u.role === 'ADMIN' ? '/admin' : '/reception');

  const { itemId } = await params;
  const { print } = await searchParams;
  const data = await labResultService.getReportData(itemId);
  if (!data) notFound();

  const backHref = u.role === 'LAB' ? `/lab/results/${itemId}` : `/invoices/${data.invoiceId}`;

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } }`}</style>
      <div className="space-y-6">
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{data.testName}</h1>
            <p className="text-sm text-slate-500">
              Report for invoice{' '}
              <span className="font-mono">{data.invoiceNo}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={backHref}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Back
            </Link>
            <PrintButton>Print report</PrintButton>
          </div>
        </div>

        <Card className="print:shadow-none print:border-0">
          <CardBody>
            <TestReportTemplate data={data} />
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