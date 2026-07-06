import { Badge } from '@/components/ui/form';
import type { Flag } from '@/types/domain';

const TONE: Record<Flag, 'success' | 'warning' | 'danger' | 'neutral'> = {
  NORMAL: 'success',
  LOW: 'warning',
  HIGH: 'danger',
  NIL: 'neutral',
};

export function ValueFlag({ flag }: { flag: Flag }) {
  return <Badge tone={TONE[flag]}>{flag}</Badge>;
}