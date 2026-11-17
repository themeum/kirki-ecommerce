import type { BadgeVariant } from '@/components/ui/badge';

export const getStatusBadgeVariant = (status?: string | null): BadgeVariant => {
  switch (status) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'warning';
    case 'trash':
    case 'spam':
    default:
      return 'secondary';
  }
};
