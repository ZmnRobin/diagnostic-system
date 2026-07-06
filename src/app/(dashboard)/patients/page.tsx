'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardBody, CardHeader, Input, EmptyState } from '@/components/ui/form';
import type { Patient } from '@/types/domain';

export default function PatientsPage() {
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['patients', q],
    queryFn: () => api<{ patients: Patient[] }>(`/api/patients${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Patients</h1>
        <Link
          href="/patients/new"
          className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          + Register Patient
        </Link>
      </div>

      <Card>
        <CardHeader title="Search patients" subtitle="Find by ID, name or mobile" />
        <CardBody>
          <Input
            placeholder="Type to search…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <p className="px-5 py-6 text-sm text-slate-500">Loading…</p>
          ) : !data?.patients?.length ? (
            <div className="px-5 py-6">
              <EmptyState title="No patients found" hint="Try a different search or register a new patient." />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2">Patient ID</th>
                  <th className="px-5 py-2">Name</th>
                  <th className="px-5 py-2">Age</th>
                  <th className="px-5 py-2">Gender</th>
                  <th className="px-5 py-2">Mobile</th>
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.patients.map((p) => (
                  <tr key={p.id}>
                    <td className="px-5 py-2 font-mono text-xs text-slate-600">{p.patientCode}</td>
                    <td className="px-5 py-2 font-medium text-slate-900">{p.name}</td>
                    <td className="px-5 py-2 text-slate-700">
                      {p.age} {p.ageUnit.toLowerCase()}
                    </td>
                    <td className="px-5 py-2 text-slate-700">{p.gender}</td>
                    <td className="px-5 py-2 text-slate-700">{p.mobile}</td>
                    <td className="px-5 py-2 text-right">
                      <Link href={`/patients/${p.id}`} className="text-sky-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}