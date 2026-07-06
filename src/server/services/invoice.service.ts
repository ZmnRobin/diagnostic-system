import { invoiceRepo, visitRepo } from '@/server/repositories/invoice.repo';
import { testRepo } from '@/server/repositories/test.repo';
import { nextInvoiceNo } from '@/server/utils/id';
import { logAudit } from '@/server/services/audit.service';
import { prisma } from '@/server/db';
import { z } from 'zod';

export const createInvoiceSchema = z.object({
  patientId: z.string().min(1),
  testIds: z.array(z.string().min(1)).min(1, 'Select at least one test'),
  discount: z.coerce.number().min(0).default(0),
  paymentMethod: z.enum(['CASH']).default('CASH'),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;

export const invoiceService = {
  /**
   * Pure calculation — used by both the invoice preview UI and the final create call
   * so the totals shown to the receptionist match what actually gets persisted.
   */
  async calculateTotals(testIds: string[], discount: number) {
    const tests = await testRepo.list({ includeInactive: false });
    const picked = tests.filter((t) => testIds.includes(t.id) && t.isActive);
    const subtotal = picked.reduce((acc, t) => acc + Number(t.price), 0);
    const safeDiscount = Math.min(discount, subtotal);
    const total = Math.max(0, subtotal - safeDiscount);
    return {
      subtotal: subtotal.toFixed(2),
      discount: safeDiscount.toFixed(2),
      total: total.toFixed(2),
      items: picked.map((t) => ({
        testId: t.id,
        name: t.name,
        code: t.code,
        price: Number(t.price).toFixed(2),
        category: t.category.name,
      })),
    };
  },

  async create(input: CreateInvoiceInput, actorUserId: string) {
    const tests = await testRepo.list({ includeInactive: false });
    const picked = tests.filter((t) => input.testIds.includes(t.id) && t.isActive);
    if (picked.length === 0) throw new Error('No valid tests selected');

    const subtotal = picked.reduce((acc, t) => acc + Number(t.price), 0);
    const safeDiscount = Math.min(input.discount, subtotal);
    const total = Math.max(0, subtotal - safeDiscount);
    const invoiceNo = await nextInvoiceNo();

    const invoice = await prisma.$transaction(async (tx) => {
      const visit = await tx.visit.create({
        data: { patientId: input.patientId, createdById: actorUserId },
      });

      const inv = await tx.invoice.create({
        data: {
          invoiceNo,
          visitId: visit.id,
          subtotal: subtotal.toFixed(2),
          discount: safeDiscount.toFixed(2),
          total: total.toFixed(2),
          paymentMethod: input.paymentMethod,
          createdById: actorUserId,
          items: {
            create: picked.map((t) => ({
              testId: t.id,
              priceAtBilling: Number(t.price).toFixed(2),
              result: {
                create: {
                  enteredById: actorUserId,
                  status: 'DRAFT',
                  values: [],
                },
              },
            })),
          },
        },
        include: { items: { include: { test: true, result: true } } },
      });

      return inv;
    });

    await logAudit({
      userId: actorUserId,
      action: 'INVOICE_CREATED',
      entity: 'Invoice',
      entityId: invoice.id,
      meta: { invoiceNo, total: invoice.total, itemCount: invoice.items.length },
    });
    await logAudit({
      userId: actorUserId,
      action: 'PAYMENT_RECEIVED',
      entity: 'Invoice',
      entityId: invoice.id,
      meta: { amount: invoice.total },
    });

    return invoiceRepo.findById(invoice.id);
  },

  get(id: string) {
    return invoiceRepo.findById(id);
  },

  list() {
    return invoiceRepo.list();
  },
};
