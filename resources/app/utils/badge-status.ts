import type { BadgeVariant } from '@/components/ui/badge';

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  processing: 'info',
  pending: 'warning',
  onHold: 'caution',
  completed: 'success',
  rewarded: 'success',
  cancelled: 'destructive',
  failed: 'destructive',
  refunded: 'secondary',
  partiallyRefunded: 'secondary',
  requested: 'requested',
  published: 'success',
  trashed: 'destructive',
  draft: 'secondary',
};

const getBadgeVariantForStatus = (status: string): BadgeVariant => {
  return STATUS_VARIANT_MAP[status] ?? 'default';
};

export { getBadgeVariantForStatus, STATUS_VARIANT_MAP };
