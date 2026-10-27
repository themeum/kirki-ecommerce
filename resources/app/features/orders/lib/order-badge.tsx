import { Cross2Icon } from '@radix-ui/react-icons';
import { CheckIcon, IterationCw, Truck } from 'lucide-react';
import type { ReactNode } from 'react';

import type { BadgeVariant } from '@/components/ui/badge';
import LeadingIconBadge from '@/components/ui/leading-icon-badge';
import type { TextColor } from '@/components/ui/text';
import type {
  FulfillmentStatus,
  OrderStatus,
  PaymentStatus,
} from '@/features/orders/schemas/catalog/order';
import { theme } from '@/theme';
import { __ } from '@/wpi18n';

export const getPaymentBadgeInfo = (
  status: PaymentStatus,
): { variant: BadgeVariant; text: string } => {
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
        variant: 'warning',
        text: __('Refunding', 'kirki-ecommerce'),
      };
    case 'refunded':
      return {
        variant: 'destructive',
        text: __('Refunded', 'kirki-ecommerce'),
      };
    default:
      return {
        variant: 'default',
        text: __('Unknown', 'kirki-ecommerce'),
      };
  }
};

export const getFulfillmentBadgeInfo = (
  status: FulfillmentStatus,
): { variant: BadgeVariant; text: string } => {
  switch (status) {
    case 'unfulfilled':
      return {
        variant: 'secondary',
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
        variant: 'warning',
        text: __('Returned', 'kirki-ecommerce'),
      };
    default:
      return {
        variant: 'default',
        text: __('Unknown', 'kirki-ecommerce'),
      };
  }
};

export const getOrderStateBadgeInfo = (
  status: OrderStatus,
): {
  icon: ReactNode;
  text: string;
  hintText: string;
  textColor: TextColor;
} => {
  switch (status) {
    case 'pending':
      return {
        icon: (
          <LeadingIconBadge
            variant="info"
            cssOverride={{ backgroundColor: theme.colors.icon.inverse }}
          />
        ),
        text: __('Order placed', 'kirki-ecommerce'),
        hintText: __('Awaiting processing', 'kirki-ecommerce'),
        textColor: 'primary',
      };
    case 'unpaid_processing':
    case 'paid_processing':
      return {
        icon: (
          <LeadingIconBadge
            cssOverride={{ backgroundColor: theme.colors.background.fillSpecial3Tertiary }}
            dotIconCssOverride={{ backgroundColor: theme.colors.background.fillSpecial2 }}
          />
        ),
        text: __('Order processing', 'kirki-ecommerce'),
        hintText: __('Awaiting shipping', 'kirki-ecommerce'),
        textColor: 'special3',
      };
    case 'on_hold_unpaid':
    case 'on_hold_paid':
      return {
        icon: <LeadingIconBadge variant="warning" />,
        text: __('Order on hold', 'kirki-ecommerce'),
        hintText: __('Awaiting processing', 'kirki-ecommerce'),
        textColor: 'warning',
      };
    case 'shipped_unpaid':
      return {
        icon: (
          <LeadingIconBadge
            icon={<Truck size={12} color={theme.colors.icon.brand} />}
            cssOverride={{ backgroundColor: theme.colors.background.solidSurfaceAlt }}
          />
        ),
        text: __('Order shipped', 'kirki-ecommerce'),
        hintText: __('Payment Pending', 'kirki-ecommerce'),
        textColor: 'primary',
      };
    case 'paid_shipped':
      return {
        icon: (
          <LeadingIconBadge
            icon={<Truck size={12} color={theme.colors.icon.brand} />}
            cssOverride={{ backgroundColor: theme.colors.background.solidSurfaceAlt }}
          />
        ),
        text: __('Order shipped', 'kirki-ecommerce'),
        hintText: __('Awaiting delivery', 'kirki-ecommerce'),
        textColor: 'primary',
      };
    case 'delivered_unpaid':
      return {
        icon: <LeadingIconBadge variant="success" />,
        text: __('Order delivered', 'kirki-ecommerce'),
        hintText: '',
        textColor: 'primary',
      };
    case 'paid_unfulfilled':
      return {
        icon: <LeadingIconBadge variant="success" />,
        text: __('Order delivered', 'kirki-ecommerce'),
        hintText: __('Awaiting processing', 'kirki-ecommerce'),
        textColor: 'primary',
      };
    case 'completed':
      return {
        icon: (
          <LeadingIconBadge
            icon={<CheckIcon size={12} color={theme.colors.icon.primary} />}
            cssOverride={{ backgroundColor: theme.colors.background.solidSurfaceSecondary }}
          />
        ),
        text: __('Order delivered', 'kirki-ecommerce'),
        hintText: '',
        textColor: 'primary',
      };
    case 'failed_unfulfilled':
      return {
        icon: <LeadingIconBadge variant="critical" />,
        text: __('Payment Failed', 'kirki-ecommerce'),
        hintText: __('Awaiting processing', 'kirki-ecommerce'),
        textColor: 'critical',
      };
    case 'paid_cancelled':
    case 'unpaid_cancelled':
      return {
        icon: (
          <LeadingIconBadge
            variant="critical"
            icon={<Cross2Icon height={12} width={12} color={theme.colors.icon.critical} />}
          />
        ),
        text: __('Order Cancelled', 'kirki-ecommerce'),
        hintText: '',
        textColor: 'warning',
      };
    case 'refund_requested':
      return {
        icon: <LeadingIconBadge variant="critical" />,
        text: __('Refund Requested', 'kirki-ecommerce'),
        hintText: __('Awaiting approval', 'kirki-ecommerce'),
        textColor: 'critical',
      };
    case 'refund_in_progress':
      return {
        icon: (
          <LeadingIconBadge
            cssOverride={{ backgroundColor: theme.colors.background.fillSpecial3Tertiary }}
            dotIconCssOverride={{ backgroundColor: theme.colors.background.fillSpecial2 }}
          />
        ),
        text: __('Refund in Progress', 'kirki-ecommerce'),
        hintText: __('Awaiting return', 'kirki-ecommerce'),
        textColor: 'special3',
      };
    case 'refunded':
      return {
        icon: (
          <LeadingIconBadge
            variant="critical"
            icon={<CheckIcon size={12} color={theme.colors.background.fillCritical} />}
          />
        ),
        text: __('Refunded', 'kirki-ecommerce'),
        hintText: '',
        textColor: 'critical',
      };
    case 'refund_declined':
      return {
        icon: (
          <LeadingIconBadge
            variant="critical"
            icon={<Cross2Icon height={12} width={12} color={theme.colors.icon.critical} />}
          />
        ),
        text: __('Refund Declined', 'kirki-ecommerce'),
        hintText: '',
        textColor: 'critical',
      };
    case 'returned_pending_refund':
      return {
        icon: (
          <LeadingIconBadge
            variant="critical"
            icon={<IterationCw size={12} color={theme.colors.icon.critical} />}
          />
        ),
        text: __('Order Returned', 'kirki-ecommerce'),
        hintText: __('Awaiting refund', 'kirki-ecommerce'),
        textColor: 'critical',
      };
    default:
      return {
        icon: <LeadingIconBadge />,
        text: status
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        hintText: '',
        textColor: 'primary',
      };
  }
};
