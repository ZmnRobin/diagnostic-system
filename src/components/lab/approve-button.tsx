'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import type { LabResult } from '@/types/domain';

export function ApproveButton({
  invoiceItemId,
  disabled,
}: {
  invoiceItemId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const approve = useMutation({
    mutationFn: () =>
      api<{ result: LabResult }>(
        `/api/lab-results/by-item/${invoiceItemId}/approve`,
        { method: 'POST' },
      ),
    onSuccess: () => {
      router.refresh();
    },
  });

  return (
    <div className="flex items-center gap-3">
      {approve.isError && (
        <span className="text-sm text-red-600">
          {(approve.error as Error).message ?? 'Approval failed'}
        </span>
      )}
      <Button
        onClick={() => {
          if (confirm('Approve and finalize this report? This cannot be undone.')) {
            approve.mutate();
          }
        }}
        disabled={disabled || approve.isPending}
      >
        {approve.isPending ? 'Approving…' : 'Approve & finalize'}
      </Button>
    </div>
  );
}