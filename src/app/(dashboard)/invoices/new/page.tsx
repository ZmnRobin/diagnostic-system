'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useInvoiceDraft } from '@/stores/invoice-draft.store';
import { Card, CardBody, CardHeader, Field, Input } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/server/utils/money';
import type { Patient, Test } from '@/types/domain';

type Totals = {
  subtotal: string;
  discount: string;
  total: string;
  items: { testId: string; name: string; code: string; price: string; category: string }[];
};

export default function NewInvoicePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-500">Loading…</div>}>
      <NewInvoicePage />
    </Suspense>
  );
}

function NewInvoicePage() {
  const router = useRouter();
  const params = useSearchParams();
  const presetPatientId = params.get('patientId') ?? '';
  const {
    patient,
    setPatient,
    patientQuery,
    setPatientQuery,
    selectedTestIds,
    toggleTest,
    clearTests,
    discount,
    setDiscount,
    reset,
  } = useInvoiceDraft();

  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [creating, setCreating] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '30',
    ageUnit: 'YEAR' as 'YEAR' | 'MONTH' | 'DAY',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    mobile: '',
    address: '',
  });

  const testsQ = useQuery({
    queryKey: ['tests'],
    queryFn: () => api<{ tests: Test[] }>('/api/tests'),
  });

  // Prefill by patient ID from the URL
  useEffect(() => {
    if (!presetPatientId || patient) return;
    (async () => {
      try {
        const data = await api<{ patient: Patient }>(`/api/patients/${presetPatientId}`);
        setPatient(data.patient);
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetPatientId]);

  // Live patient search
  useEffect(() => {
    if (!patientQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      try {
        const data = await api<{ patients: Patient[] }>(
          `/api/patients?q=${encodeURIComponent(patientQuery.trim())}`,
        );
        setSearchResults(data.patients);
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [patientQuery]);

  const preview = useMutation({
    mutationFn: (vars: { testIds: string[]; discount: number }) =>
      api<Totals>('/api/invoices/preview', {
        method: 'POST',
        body: JSON.stringify(vars),
      }),
  });

  // Recalculate totals when selection/discount changes
  useEffect(() => {
    if (selectedTestIds.length === 0) {
      preview.reset();
      return;
    }
    preview.mutate({ testIds: selectedTestIds, discount });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTestIds.join(','), discount]);

  const create = useMutation({
    mutationFn: () =>
      api<{ invoice: { id: string; invoiceNo: string } }>('/api/invoices', {
        method: 'POST',
        body: JSON.stringify({
          patientId: patient!.id,
          testIds: selectedTestIds,
          discount,
          paymentMethod: 'CASH',
        }),
      }),
    onSuccess: (data) => {
      reset();
      router.replace(`/invoices/${data.invoice.id}?print=1`);
    },
  });

  const totals = preview.data;
  const grouped = useMemo(() => {
    const map: Record<string, Test[]> = {};
    for (const t of testsQ.data?.tests ?? []) {
      if (!t.isActive) continue;
      (map[t.category.name] ||= []).push(t);
    }
    return map;
  }, [testsQ.data]);

  const submitDisabled = !patient || selectedTestIds.length === 0 || create.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">New Invoice</h1>
          <p className="text-sm text-slate-500">Register patient, choose tests, collect payment.</p>
        </div>
        <Link
          href="/invoices"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Cancel
        </Link>
      </div>

      {/* Step 1: Patient */}
      <Card>
        <CardHeader
          title="Step 1 — Patient"
          subtitle={patient ? `Selected: ${patient.name} (${patient.patientCode})` : 'Search or register'}
          action={
            patient ? (
              <Button variant="ghost" size="sm" onClick={() => setPatient(null)}>
                Change
              </Button>
            ) : null
          }
        />
        <CardBody>
          {!patient ? (
            <div className="space-y-4">
              <Input
                placeholder="Search by ID, name or mobile…"
                value={patientQuery}
                onChange={(e) => setPatientQuery(e.target.value)}
                autoFocus
              />
              {patientQuery && (
                <div className="rounded-md border border-slate-200 bg-white">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No matches.{' '}
                      <button
                        className="text-sky-600 hover:underline"
                        onClick={() => setCreating(true)}
                      >
                        Register new patient
                      </button>
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {searchResults.map((p) => (
                        <li key={p.id}>
                          <button
                            className="flex w-full items-center justify-between px-4 py-2 text-left hover:bg-slate-50"
                            onClick={() => {
                              setPatient(p);
                              setPatientQuery('');
                            }}
                          >
                            <span className="font-medium text-slate-900">{p.name}</span>
                            <span className="text-xs text-slate-500">
                              {p.patientCode} · {p.mobile}
                            </span>
                          </button>
                        </li>
                      ))}
                      <li>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-sky-600 hover:bg-sky-50"
                          onClick={() => setCreating(true)}
                        >
                          + Register new patient
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
              )}

              {creating && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="Name" required>
                      <Input
                        value={newPatient.name}
                        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      />
                    </Field>
                    <Field label="Mobile" required>
                      <Input
                        value={newPatient.mobile}
                        onChange={(e) => setNewPatient({ ...newPatient, mobile: e.target.value })}
                      />
                    </Field>
                    <Field label="Age" required>
                      <Input
                        type="number"
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      />
                    </Field>
                    <Field label="Unit">
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={newPatient.ageUnit}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, ageUnit: e.target.value as 'YEAR' | 'MONTH' | 'DAY' })
                        }
                      >
                        <option value="YEAR">Years</option>
                        <option value="MONTH">Months</option>
                        <option value="DAY">Days</option>
                      </select>
                    </Field>
                    <Field label="Gender">
                      <select
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                        value={newPatient.gender}
                        onChange={(e) =>
                          setNewPatient({ ...newPatient, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })
                        }
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </Field>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!newPatient.name || !newPatient.mobile}
                      onClick={async () => {
                        try {
                          const data = await api<{ patient: Patient }>('/api/patients', {
                            method: 'POST',
                            body: JSON.stringify({
                              name: newPatient.name,
                              age: parseInt(newPatient.age || '0', 10),
                              ageUnit: newPatient.ageUnit,
                              gender: newPatient.gender,
                              mobile: newPatient.mobile,
                              address: newPatient.address || null,
                            }),
                          });
                          setPatient(data.patient);
                          setCreating(false);
                          setNewPatient({
                            name: '',
                            age: '30',
                            ageUnit: 'YEAR',
                            gender: 'MALE',
                            mobile: '',
                            address: '',
                          });
                        } catch (err) {
                          alert((err as Error).message);
                        }
                      }}
                    >
                      Save & select
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-slate-500">Name</dt>
                <dd className="text-slate-900">{patient.name}</dd>
              </div>
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
            </dl>
          )}
        </CardBody>
      </Card>

      {/* Step 2: Tests */}
      <Card>
        <CardHeader
          title="Step 2 — Tests"
          subtitle={`${selectedTestIds.length} selected`}
          action={
            selectedTestIds.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={clearTests}>
                Clear
              </Button>
            ) : null
          }
        />
        <CardBody className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <p className="text-sm text-slate-500">Loading tests…</p>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {cat}
                </h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((t) => {
                    const selected = selectedTestIds.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTest(t.id)}
                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                          selected
                            ? 'border-sky-500 bg-sky-50 text-sky-900'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <span>
                          <span className="block font-medium">{t.name}</span>
                          <span className="text-xs text-slate-500">{t.code}</span>
                        </span>
                        <span className="font-semibold">{formatMoney(t.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </CardBody>
      </Card>

      {/* Step 3: Totals & confirm */}
      <Card>
        <CardHeader title="Step 3 — Totals & payment" />
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Discount (PKR)" hint="Optional, cannot exceed subtotal">
              <Input
                type="number"
                step="0.01"
                min="0"
                value={String(discount)}
                onChange={(e) => setDiscount(parseFloat(e.target.value || '0'))}
              />
            </Field>
            <div className="space-y-1 self-end rounded-md bg-slate-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-900">
                  {totals ? formatMoney(totals.subtotal) : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Discount</span>
                <span className="font-medium text-slate-900">
                  {totals ? `− ${formatMoney(totals.discount)}` : '—'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1">
                <span className="text-base font-semibold text-slate-900">Total</span>
                <span className="text-base font-semibold text-slate-900">
                  {totals ? formatMoney(totals.total) : '—'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Payment method: <span className="font-medium text-slate-700">Cash</span> (only option in Phase 1)
            </p>
            <Button
              size="lg"
              disabled={submitDisabled}
              onClick={() => create.mutate()}
            >
              {create.isPending ? 'Saving…' : 'Confirm & Print'}
            </Button>
          </div>
          {create.error && (
            <p className="mt-3 text-sm text-red-600">{(create.error as Error).message}</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
