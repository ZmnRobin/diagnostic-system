'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, Field, Input, Textarea } from '@/components/ui/form';
import { evaluateFlag } from '@/lib/lab/flag';
import { ValueFlag } from '@/components/reports/value-flag';
import type { Flag, LabResult, RangeEntry } from '@/types/domain';

type Gender = 'MALE' | 'FEMALE' | 'OTHER';

type Row = {
  analyte: string;
  unit: string;
  reference: string;
  rawValue: string;
};

function rangesToRows(ranges: RangeEntry[]): Row[] {
  return ranges.map((r) => ({
    analyte: r.analyte,
    unit: r.unit ?? '',
    reference: r.generalRef ?? r.maleRef ?? r.femaleRef ?? '',
    rawValue: '',
  }));
}

function findMatchingRange(
  ranges: RangeEntry[],
  analyte: string,
): RangeEntry | undefined {
  const t = analyte.trim().toLowerCase();
  if (!t) return undefined;
  const exact = ranges.find((r) => r.analyte.trim().toLowerCase() === t);
  if (exact) return exact;
  const partial = ranges.filter((r) => {
    const n = r.analyte.trim().toLowerCase();
    return n !== '' && (n.includes(t) || t.includes(n));
  });
  return partial.length === 1 ? partial[0] : undefined;
}

export function ResultEntryForm({
  invoiceItemId,
  ranges,
  initialValues,
  initialComments,
  readOnly,
  patientGender,
}: {
  invoiceItemId: string;
  ranges: RangeEntry[];
  initialValues: Array<{ analyte: string; value: string }>;
  initialComments: string;
  readOnly: boolean;
  patientGender: Gender;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => {
    if (initialValues.length > 0) {
      // Hydrate from saved values where possible; preserve order of ranges
      // for the visible UI by appending any unknown analytes at the end.
      const known = rangesToRows(ranges).map((r) => {
        const match = initialValues.find(
          (v) => v.analyte.trim().toLowerCase() === r.analyte.trim().toLowerCase(),
        );
        return { ...r, rawValue: match?.value ?? '' };
      });
      const extras = initialValues
        .filter(
          (v) => !ranges.some((r) => r.analyte.trim().toLowerCase() === v.analyte.trim().toLowerCase()),
        )
        .map((v) => ({ analyte: v.analyte, unit: '', reference: '', rawValue: v.value }));
      return [...known, ...extras];
    }
    return rangesToRows(ranges);
  });
  const [comments, setComments] = useState<string>(initialComments);

  const hasAnyValue = rows.some((r) => r.rawValue.trim() !== '');

  const flagsByAnalyte = useMemo(() => {
    const map = new Map<string, Flag>();
    for (const r of rows) {
      const range = findMatchingRange(ranges, r.analyte);
      if (range) {
        map.set(r.analyte, evaluateFlag(r.rawValue, range, patientGender));
      } else {
        map.set(r.analyte, 'NIL');
      }
    }
    return map;
  }, [rows, ranges]);

  const save = useMutation({
    mutationFn: () =>
      api<{ result: LabResult }>(`/api/lab-results/by-item/${invoiceItemId}/draft`, {
        method: 'POST',
        body: JSON.stringify({
          values: rows
            .filter((r) => r.rawValue.trim() !== '')
            .map((r) => ({ analyte: r.analyte, value: r.rawValue, unit: r.unit || undefined })),
          comments: comments.trim() === '' ? null : comments,
        }),
      }),
    onSuccess: () => {
      router.refresh();
    },
  });

  return (
    <Card>
      <CardHeader
        title={readOnly ? 'Result (approved — read only)' : 'Enter results'}
        subtitle={
          readOnly
            ? 'This report is finalized. To re-issue, create a new invoice for the test.'
            : 'Fill the analyte values. Flags update as you type.'
        }
      />
      <CardBody>
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">
            No analytes configured for this test. Add reference ranges on the test catalog.
          </p>
        ) : (
          <div className="space-y-3">
            {rows.map((r, idx) => {
              const flag = flagsByAnalyte.get(r.analyte) ?? 'NIL';
              return (
                <div
                  key={`${r.analyte}-${idx}`}
                  className="grid grid-cols-12 items-end gap-3 rounded-md border border-slate-100 bg-slate-50 p-3"
                >
                  <div className="col-span-12 sm:col-span-4">
                    <p className="text-sm font-medium text-slate-900">{r.analyte}</p>
                    {r.unit && (
                      <p className="text-xs text-slate-500">Unit: {r.unit}</p>
                    )}
                    {r.reference && (
                      <p className="text-xs text-slate-500">Ref: {r.reference}</p>
                    )}
                  </div>
                  <div className="col-span-8 sm:col-span-5">
                    <Input
                      placeholder="Value"
                      value={r.rawValue}
                      disabled={readOnly}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((row, i) =>
                            i === idx ? { ...row, rawValue: e.target.value } : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="col-span-4 flex items-center justify-end sm:col-span-3">
                    <ValueFlag flag={flag} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4">
          <Field label="Comments">
            <Textarea
              rows={3}
              placeholder="Optional notes for the report"
              value={comments}
              disabled={readOnly}
              onChange={(e) => setComments(e.target.value)}
            />
          </Field>
        </div>

        {!readOnly && (
          <div className="mt-4 flex items-center justify-end gap-2">
            {save.isError && (
              <span className="text-sm text-red-600">
                {(save.error as Error).message ?? 'Save failed'}
              </span>
            )}
            {save.isSuccess && (
              <span className="text-sm text-green-700">Draft saved.</span>
            )}
            <Button
              onClick={() => save.mutate()}
              disabled={!hasAnyValue || save.isPending}
            >
              {save.isPending ? 'Saving…' : 'Save draft'}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}