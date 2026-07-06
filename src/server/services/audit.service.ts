import { prisma } from '@/server/db';

export type AuditAction =
  | 'USER_LOGIN'
  | 'USER_LOGOUT'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'PATIENT_CREATED'
  | 'PATIENT_UPDATED'
  | 'TEST_CREATED'
  | 'TEST_UPDATED'
  | 'TEST_DELETED'
  | 'INVOICE_CREATED'
  | 'PAYMENT_RECEIVED'
  | 'REPORT_DRAFT_SAVED'
  | 'REPORT_APPROVED'
  | 'EXPENSE_CREATED'
  | 'INCOME_CREATED'
  | 'SETTING_UPDATED';

export async function logAudit(args: {
  userId?: string | null;
  action: AuditAction;
  entity?: string;
  entityId?: string;
  meta?: Record<string, unknown>;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: args.userId ?? null,
        action: args.action,
        entity: args.entity,
        entityId: args.entityId,
        meta: args.meta as object | undefined,
      },
    });
  } catch (err) {
    // Audit must not break the main flow.
    console.error('[audit] failed to write log', err);
  }
}
