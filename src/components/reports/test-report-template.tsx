import { Badge } from '@/components/ui/form';
import { ValueFlag } from '@/components/reports/value-flag';
import { fmtDate, fmtDateTime } from '@/server/utils/date';
import type { ReportData } from '@/types/domain';

export function TestReportTemplate({ data }: { data: ReportData }) {
  const isApproved = data.status === 'APPROVED';

  return (
    <div className="space-y-6">
      {/* Center header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl font-semibold text-slate-900">{data.centerName}</h2>
        {data.centerAddress && (
          <p className="text-sm text-slate-600">{data.centerAddress}</p>
        )}
        {data.centerPhone && (
          <p className="text-sm text-slate-600">Phone: {data.centerPhone}</p>
        )}
      </div>

      {/* Title + status */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {data.testName}
            <span className="ml-2 font-mono text-base text-slate-500">({data.testCode})</span>
          </h1>
          <p className="text-sm text-slate-500">
            {data.categoryName} · Invoice{' '}
            <span className="font-mono">{data.invoiceNo}</span>
          </p>
        </div>
        <div className="text-right">
          {isApproved ? (
            <Badge tone="success">FINAL · APPROVED</Badge>
          ) : (
            <Badge tone="warning">DRAFT</Badge>
          )}
          {isApproved && data.approvedAt && (
            <p className="mt-1 text-xs text-slate-500">
              Approved by {data.approvedByName ?? '—'} on {fmtDateTime(data.approvedAt)}
            </p>
          )}
          {!isApproved && (
            <p className="mt-1 text-xs text-slate-500">
              Entered by {data.enteredByName} · not yet finalized
            </p>
          )}
        </div>
      </div>

      {/* Patient + collection info */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Patient</p>
          <p className="font-semibold text-slate-900">{data.patient.name}</p>
          <p className="text-slate-600">
            {data.patient.patientCode} · {data.patient.age}{' '}
            {data.patient.ageUnit.toLowerCase()} · {data.patient.gender}
          </p>
          <p className="text-slate-600">{data.patient.mobile}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Billed on</p>
          <p className="font-semibold text-slate-900">{fmtDate(data.collectedAt)}</p>
          {data.patient.address && (
            <p className="mt-1 text-xs text-slate-500">{data.patient.address}</p>
          )}
        </div>
      </div>

      {/* Results table */}
      {data.rows.length === 0 ? (
        <p className="text-sm text-slate-500">
          No analytes are configured for this test. Reference ranges need to be set on the test catalog.
        </p>
      ) : (
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2">Analyte</th>
              <th className="py-2">Result</th>
              <th className="py-2">Unit</th>
              <th className="py-2">Reference</th>
              <th className="py-2 text-right">Flag</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((row) => (
              <tr key={row.analyte}>
                <td className="py-2 font-medium text-slate-900">{row.analyte}</td>
                <td className="py-2 text-slate-900">{row.value ?? '—'}</td>
                <td className="py-2 text-slate-600">{row.unit || '—'}</td>
                <td className="py-2 text-slate-600">{row.reference || '—'}</td>
                <td className="py-2 text-right">
                  <ValueFlag flag={row.flag} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.comments && (
        <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Comments</p>
          <p className="mt-1 whitespace-pre-wrap text-slate-800">{data.comments}</p>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate-400">
        Thank you for visiting {data.centerName}.
      </p>
    </div>
  );
}