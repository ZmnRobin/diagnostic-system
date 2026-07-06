'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Card, CardBody, CardHeader, Field, Input, Select, EmptyState } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/server/utils/money';
import type { Test, TestCategory } from '@/types/domain';

type Category = { id: string; name: string };

export default function TestsPage() {
  const qc = useQueryClient();
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editing, setEditing] = useState<Test | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    categoryId: '',
    price: '0',
  });

  const categoriesQ = useQuery({
    queryKey: ['categories'],
    queryFn: () => api<{ categories: Category[] }>('/api/test-categories'),
  });
  const testsQ = useQuery({
    queryKey: ['tests'],
    queryFn: () => api<{ tests: Test[] }>('/api/tests'),
  });

  const createCat = useMutation({
    mutationFn: (name: string) =>
      api('/api/test-categories', { method: 'POST', body: JSON.stringify({ name }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      setNewCatName('');
      setCreatingCategory(false);
    },
  });

  const saveTest = useMutation({
    mutationFn: (values: typeof form & { id?: string }) => {
      const payload = {
        code: values.code,
        name: values.name,
        categoryId: values.categoryId,
        price: parseFloat(values.price || '0'),
        referenceRanges: [],
        isActive: true,
      };
      if (values.id) {
        return api(`/api/tests/${values.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      }
      return api('/api/tests', { method: 'POST', body: JSON.stringify(payload) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tests'] });
      setEditing(null);
      setForm({ code: '', name: '', categoryId: '', price: '0' });
    },
  });

  const removeTest = useMutation({
    mutationFn: (id: string) => api(`/api/tests/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tests'] }),
  });

  const groups = (testsQ.data?.tests ?? []).reduce<Record<string, Test[]>>((acc, t) => {
    (acc[t.category.name] ||= []).push(t);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Test Catalog</h1>
          <p className="text-sm text-slate-500">Manage test categories and prices.</p>
        </div>
        <div className="flex gap-2">
          {creatingCategory ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Category name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="!w-44"
              />
              <Button
                size="sm"
                onClick={() => createCat.mutate(newCatName.trim())}
                disabled={!newCatName.trim() || createCat.isPending}
              >
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCreatingCategory(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => setCreatingCategory(true)}>
              + Category
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => {
              setEditing({ id: '', code: '', name: '', categoryId: '', price: '0', referenceRanges: [], isActive: true } as unknown as Test);
              setForm({ code: '', name: '', categoryId: '', price: '0' });
            }}
          >
            + New Test
          </Button>
        </div>
      </div>

      {editing && (
        <Card>
          <CardHeader title={editing.id ? `Edit ${editing.name}` : 'New test'} />
          <CardBody>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveTest.mutate({ ...form, id: editing.id || undefined });
              }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-4"
            >
              <Field label="Code" required>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </Field>
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Category" required>
                <Select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  required
                >
                  <option value="">Select…</option>
                  {(categoriesQ.data?.categories ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Price (PKR)" required>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                />
              </Field>
              <div className="flex justify-end gap-2 sm:col-span-4">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveTest.isPending}>
                  {saveTest.isPending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {Object.keys(groups).length === 0 ? (
        <EmptyState title="No tests yet" hint="Add categories then add tests inside each." />
      ) : (
        <div className="space-y-4">
          {Object.entries(groups).map(([cat, items]) => (
            <Card key={cat}>
              <CardHeader title={cat} subtitle={`${items.length} test(s)`} />
              <CardBody className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-2">Code</th>
                      <th className="px-5 py-2">Name</th>
                      <th className="px-5 py-2 text-right">Price</th>
                      <th className="px-5 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((t) => (
                      <tr key={t.id}>
                        <td className="px-5 py-2 font-mono text-xs text-slate-600">{t.code}</td>
                        <td className="px-5 py-2 font-medium text-slate-900">{t.name}</td>
                        <td className="px-5 py-2 text-right text-slate-900">
                          {formatMoney(t.price)}
                        </td>
                        <td className="px-5 py-2 text-right">
                          <button
                            className="mr-3 text-sky-600 hover:underline"
                            onClick={() => {
                              setEditing(t);
                              setForm({
                                code: t.code,
                                name: t.name,
                                categoryId: t.categoryId,
                                price: String(t.price),
                              });
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:underline"
                            onClick={() => {
                              if (confirm(`Deactivate ${t.name}?`)) removeTest.mutate(t.id);
                            }}
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">
        Note: Deactivating a test hides it from new invoices but preserves historical invoices.
      </p>
    </div>
  );
}
