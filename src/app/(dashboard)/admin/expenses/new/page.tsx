'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { format } from 'date-fns';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, EmptyState, Field, Input } from '@/components/ui/form';
import { formatMoney } from '@/server/utils/money';

const schema = z.object({
  date: z.string().min(1, 'Date is required'),
  category: z.string().min(1, 'Category is required').max(60),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().max(255).optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

type ExpenseRow = {
  id: string;
  date: string;
  category: string;
  amount: string;
  description: string | null;
  createdBy?: { name: string } | null;
};

export default function NewExpensePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [serverErr, setServerErr] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      amount: 0,
      description: '',
    },
  });

  const list = useQuery({
    queryKey: ['expenses-today'],
    queryFn: () => api<{ expenses: ExpenseRow[] }>('/api/admin/expenses'),
  });

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      api<{ expense: ExpenseRow }>('/api/admin/expenses', {
        method: 'POST',
        body: JSON.stringify({
          date: values.date,
          category: values.category,
          amount: values.amount,
          description: values.description || null,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses-today'] });
      reset({
        date: format(new Date(), 'yyyy-MM-dd'),
        category: '',
        amount: 0,
        description: '',
      });
    },
    onError: (err) => setServerErr((err as Error).message),
  });

  const totalToday = (list.data?.expenses ?? []).reduce(
    (acc, e) => acc + Number(e.amount),
    0,
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Record expense</h1>
          <p className="text-sm text-slate-500">Daily expenses for the centre.</p>
        </div>
        <Link
          href="/admin"
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </div>

      <Card>
        <CardHeader title="New expense" />
        <CardBody>
          <form
            onSubmit={handleSubmit((v) => {
              setServerErr(null);
              create.mutate(v);
            })}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Field label="Date" required error={errors.date?.message}>
              <Input type="date" {...register('date')} />
            </Field>
            <Field label="Category" required error={errors.category?.message}>
              <Input
                placeholder="e.g. Utilities, Rent, Salaries"
                {...register('category')}
              />
            </Field>
            <Field label="Amount (PKR)" required error={errors.amount?.message}>
              <Input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Description" hint="Optional">
                <Input placeholder="Notes" {...register('description')} />
              </Field>
            </div>

            {serverErr && (
              <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverErr}
              </div>
            )}

            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => router.push('/admin')}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Save expense'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Today"
          subtitle={`${(list.data?.expenses ?? []).length} expense(s) · Total ${formatMoney(totalToday.toFixed(2))}`}
          action={
            <button
              onClick={() => list.refetch()}
              className="text-xs font-medium text-sky-600 hover:underline"
            >
              Refresh
            </button>
          }
        />
        <CardBody className="p-0">
          {list.isLoading ? (
            <p className="px-5 py-6 text-sm text-slate-500">Loading…</p>
          ) : (list.data?.expenses ?? []).length === 0 ? (
            <div className="px-5 py-6">
              <EmptyState title="No expenses today" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-2">Category</th>
                  <th className="px-5 py-2">Description</th>
                  <th className="px-5 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(list.data?.expenses ?? []).map((e) => (
                  <tr key={e.id}>
                    <td className="px-5 py-2 font-medium text-slate-900">{e.category}</td>
                    <td className="px-5 py-2 text-slate-600">{e.description ?? '—'}</td>
                    <td className="px-5 py-2 text-right font-medium text-red-700">
                      −{formatMoney(e.amount)}
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