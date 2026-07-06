'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, Field, Input, Select } from '@/components/ui/form';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().int().min(0).max(150),
  ageUnit: z.enum(['YEAR', 'MONTH', 'DAY']),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  mobile: z.string().min(7, 'Mobile is required'),
  address: z.string().optional().nullable(),
});

type FormValues = z.infer<typeof schema>;

export default function NewPatientPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { ageUnit: 'YEAR', gender: 'MALE', age: 30 },
  });

  const create = useMutation({
    mutationFn: (values: FormValues) =>
      api<{ patient: { id: string; patientCode: string } }>('/api/patients', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: (data) => {
      router.replace(`/patients/${data.patient.id}`);
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Register Patient</h1>
        <p className="text-sm text-slate-500">Creates a new patient record.</p>
      </div>

      <Card>
        <CardHeader title="Patient information" />
        <CardBody>
          <form
            onSubmit={handleSubmit((v) => create.mutate(v))}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <Field label="Full name" required error={errors.name?.message}>
              <Input autoFocus {...register('name')} />
            </Field>

            <Field label="Mobile" required error={errors.mobile?.message}>
              <Input {...register('mobile')} placeholder="e.g. 03001234567" />
            </Field>

            <Field label="Age" required error={errors.age?.message}>
              <Input type="number" {...register('age', { valueAsNumber: true })} />
            </Field>

            <Field label="Unit" required>
              <Select {...register('ageUnit')}>
                <option value="YEAR">Years</option>
                <option value="MONTH">Months</option>
                <option value="DAY">Days</option>
              </Select>
            </Field>

            <Field label="Gender" required>
              <Select {...register('gender')}>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </Select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Address" hint="Optional">
                <Input {...register('address')} />
              </Field>
            </div>

            {create.error && (
              <div className="sm:col-span-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {(create.error as Error).message}
              </div>
            )}

            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Saving…' : 'Register'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}