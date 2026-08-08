import { BadgeVariant } from '@/components/ui/badge';
import type { FulfillmentStatus, PaymentStatus } from '@/types';
import { __ } from '@/wpi18n';

export const getPaymentBadgeInfo = (status: PaymentStatus): { variant: BadgeVariant, text: string } => {
  switch (status) {
    case 'paid':
      return {
        variant: 'success',
        text: __('Paid', 'kirki-ecommerce'),
      };
    case 'unpaid':
      return {
        variant: 'warning',
        text: __('Unpaid', 'kirki-ecommerce'),
      };
    case 'failed':
      return {
        variant: 'destructive',
        text: __('Failed', 'kirki-ecommerce'),
      };
    case 'refunding':
      return {
        variant: 'caution',
        text: __('Refunding', 'kirki-ecommerce'),
      };
    case 'refunded':
      return {
        variant: 'secondary',
        text: __('Refunded', 'kirki-ecommerce'),
      };
    default:
      return {
        variant: 'default',
        text: __('Unknown', 'kirki-ecommerce'),
      };
  }
}

export const getFulfillmentBadgeInfo = (status: FulfillmentStatus): { variant: BadgeVariant, text: string } => {
  switch (status) {
    case 'unfulfilled':
      return {
        variant: 'warning',
        text: __('Unfulfilled', 'kirki-ecommerce'),
      };
    case 'processing':
      return {
        variant: 'info',
        text: __('Processing', 'kirki-ecommerce'),
      };
    case 'shipped':
      return {
        variant: 'info',
        text: __('Shipped', 'kirki-ecommerce'),
      };
    case 'delivered':
      return {
        variant: 'success',
        text: __('Delivered', 'kirki-ecommerce'),
      };
    case 'on-hold':
      return {
        variant: 'caution',
        text: __('On hold', 'kirki-ecommerce'),
      };
    case 'cancelled':
      return {
        variant: 'destructive',
        text: __('Cancelled', 'kirki-ecommerce'),
      };
    case 'returned':
      return {
        variant: 'secondary',
        text: __('Returned', 'kirki-ecommerce'),
      };
    default:
      return {
        variant: 'default',
        text: __('Unknown', 'kirki-ecommerce'),
      };
  }
}

export const getFulfillmentHint = (status: FulfillmentStatus): string => {
  switch (status) {
    case 'unfulfilled':
      return __('Awaiting processing', 'kirki-ecommerce');
    case 'processing':
      return __('Awaiting shipping', 'kirki-ecommerce');
    case 'shipped':
      return __('Awaiting delivery', 'kirki-ecommerce');
    case 'delivered':
      return __('Fulfilled', 'kirki-ecommerce');
    case 'on-hold':
      return __('Paused by admin', 'kirki-ecommerce');
    case 'cancelled':
      return __('Fulfillment cancelled', 'kirki-ecommerce');
    case 'returned':
      return __('Returned by customer', 'kirki-ecommerce');
    default:
      return '';
  }
}
