import { z } from 'zod';

export const expenseSchema = z.object({
  date: z.coerce.date(),
  category: z.string().min(1).max(60),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().max(255).optional().nullable(),
});

export const manualIncomeSchema = z.object({
  date: z.coerce.date(),
  category: z.string().min(1).max(60),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().max(255).optional().nullable(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ManualIncomeInput = z.infer<typeof manualIncomeSchema>;