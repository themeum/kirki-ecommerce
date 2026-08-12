import type { BadgeVariant } from '@/components/ui/badge';
import type { CouponStatus } from '@/schemas/catalog/coupon';
import { __ } from '@/wpi18n';

export const getCouponBadgeInfo = (status: CouponStatus): { variant: BadgeVariant, text: string } => {
  switch (status) {
    case 'active':
      return {
        variant: 'success',
        text: __('Active', 'kirki-ecommerce'),
      };
    case 'expired':
      return {
        variant: 'caution',
        text: __('Expired', 'kirki-ecommerce'),
      };
    case 'inactive':
      return {
        variant: 'destructive',
        text: __('Inactive', 'kirki-ecommerce'),
      };
    case 'scheduled':
      return {
        variant: 'warning',
        text: __('Scheduled', 'kirki-ecommerce'),
      };
    default:
      return {
        variant: 'default',
        text: __('Unknown', 'kirki-ecommerce'),
      };
  }
}