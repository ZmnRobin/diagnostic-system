import { z } from 'zod';

export const resultValueEntrySchema = z.object({
  analyte: z.string().min(1).max(120),
  value: z.string().max(120),
  unit: z.string().max(40).optional(),
});

export const saveDraftSchema = z.object({
  values: z.array(resultValueEntrySchema).default([]),
  comments: z.string().max(2000).optional().nullable(),
});

export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
export type ResultValueEntryInput = z.infer<typeof resultValueEntrySchema>;