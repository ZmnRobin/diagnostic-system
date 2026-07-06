import { labResultRepo } from '@/server/repositories/labResult.repo';
import { monthRange } from '@/server/utils/date';

export const labAnalyticsService = {
  async snapshot() {
    const range = monthRange();

    const [topTestsThisMonth, pendingQueue, approvedThisMonth] = await Promise.all([
      labResultRepo.countByTestThisMonth(range.from, range.to),
      // Pending queue rows with patient + test name for the admin UI.
      (async () => {
        const rows = await labResultRepo.listPending();
        return rows.slice(0, 10).map((r) => ({
          invoiceItemId: r.invoiceItem.id,
          patientName: r.invoiceItem.invoice.visit.patient.name,
          patientCode: r.invoiceItem.invoice.visit.patient.patientCode,
          testName: r.invoiceItem.test.name,
          testCode: r.invoiceItem.test.code,
          receivedAt: r.createdAt,
        }));
      })(),
      // Approved this-month count.
      (async () => {
        const approved = await labResultRepo.listApproved(range);
        return approved.length;
      })(),
    ]);

    return {
      topTestsThisMonth: topTestsThisMonth.slice(0, 5),
      pendingQueue,
      approvedThisMonth,
    };
  },
};