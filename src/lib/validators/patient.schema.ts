import { z } from 'zod';

export const GenderEnum = z.enum(['MALE', 'FEMALE', 'OTHER']);
export const AgeUnitEnum = z.enum(['YEAR', 'MONTH', 'DAY']);

export const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  age: z.coerce.number().int().min(0).max(150),
  ageUnit: AgeUnitEnum.default('YEAR'),
  gender: GenderEnum,
  mobile: z.string().min(7).max(20),
  address: z.string().max(255).optional().nullable(),
});

export const updatePatientSchema = createPatientSchema;

export const patientSearchSchema = z.object({
  q: z.string().trim().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;