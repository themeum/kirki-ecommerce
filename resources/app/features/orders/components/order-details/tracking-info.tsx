import { Copy, Edit3, EllipsisVertical, ExternalLink } from 'lucide-react';

import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import { useOrderDetails } from '@/features/orders/hooks/use-order-details';
import type { OrderTracking } from '@/features/orders/schemas/catalog/order';
import { useOrderShippingCarriersQuery } from '@/features/orders/services/order';
import { TruckIcon } from '@/icons/common';
import { theme } from '@/theme';
import { defineStyles, flexCenter } from '@/theme/mixins';
import { copyToClipboard } from '@/utils';
import { isDefined } from '@/utils/object';
import { __, sprintf } from '@/wpi18n';

type TrackingInfoProps = {
  orderId: number;
  tracking: OrderTracking;
  onEdit: () => void;
};

const TrackingInfo = ({ orderId, tracking, onEdit }: TrackingInfoProps) => {
  const { order } = useOrderDetails();
  const { data: carriers } = useOrderShippingCarriersQuery(orderId);

  const carrierName = tracking.carrier?.trim() ?? '';
  const trackingNumber = tracking.tracking_number ?? '';
  const trackingUrl = tracking.tracking_url ?? '';
  const logoUrl = carriers?.find((carrier) => carrier.name === carrierName)?.logo_url;

  const trackLabel = carrierName
    ? sprintf(__('Track on %s site', 'kirki-ecommerce'), carrierName)
    : __('Track shipment', 'kirki-ecommerce');

  return (
    <Flex justify="space-between" align="center" gap={2} cssOverride={styles.container}>
      <Flex align="center" gap={2} cssOverride={styles.details}>
        <Flex cssOverride={styles.logo}>
          {logoUrl ? (
            <Image src={logoUrl} alt="" width={32} height={32} fit="contain" />
          ) : (
            <TruckIcon />
          )}
        </Flex>
        <Flex direction="column" cssOverride={styles.details}>
          {carrierName && (
            <Text variant="small" weight="medium" truncate>
              {carrierName}
            </Text>
          )}
          <Text variant="tiny" color="subdued" truncate>
            {trackingNumber}
          </Text>
        </Flex>
      </Flex>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={__('Tracking actions', 'kirki-ecommerce')}
            cssOverride={styles.trigger}
          >
            <EllipsisVertical size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => copyToClipboard(trackingNumber)}>
            <Copy size={14} color={theme.colors.icon.secondary} />
            <span>{__('Copy tracking number', 'kirki-ecommerce')}</span>
          </DropdownMenuItem>
          {isDefined(order) && order.fulfillment_status !== 'delivered' && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit3 size={14} color={theme.colors.icon.secondary} />
              <span>{__('Edit tracking', 'kirki-ecommerce')}</span>
            </DropdownMenuItem>
          )}

          {trackingUrl && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => window.open(trackingUrl, '_blank', 'noopener,noreferrer')}
              >
                <ExternalLink size={14} color={theme.colors.icon.secondary} />
                <span>{trackLabel}</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </Flex>
  );
};

const styles = defineStyles({
  container: {
    backgroundColor: theme.colors.background.surfaceAlt,
    padding: theme.spacing[2],
    borderRadius: theme.radius.xl,
  },
  details: {
    minWidth: 0,
  },
  logo: {
    ...flexCenter(),
    flexShrink: 0,
    width: 32,
    height: 32,
    overflow: 'hidden',
    borderRadius: theme.radius.md,
  },
  trigger: {
    flexShrink: 0,
  },
});

TrackingInfo.displayName = 'TrackingInfo';

export default TrackingInfo;
