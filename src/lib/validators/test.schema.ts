import { z } from 'zod';

export const testCategorySchema = z.object({
  name: z.string().min(1).max(80),
});

export const rangeSchema = z.object({
  analyte: z.string().min(1),
  unit: z.string().optional().default(''),
  maleRef: z.string().optional().default(''),
  femaleRef: z.string().optional().default(''),
  generalRef: z.string().optional().default(''),
});

export const createTestSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(120),
  categoryId: z.string().min(1),
  price: z.coerce.number().min(0),
  referenceRanges: z.array(rangeSchema).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const updateTestSchema = createTestSchema;

export type CreateTestInput = z.infer<typeof createTestSchema>;
export type UpdateTestInput = z.infer<typeof updateTestSchema>;
export type RangeInput = z.infer<typeof rangeSchema>;
