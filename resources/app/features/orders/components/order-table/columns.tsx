import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import { getFulfillmentBadgeInfo, getPaymentBadgeInfo } from '@/features/orders/lib/order-badge';
import type { OrderListItem } from '@/features/orders/schemas/catalog/order';
import { DATE_FORMATS } from '@/libs/date';
import { __, sprintf } from '@/wpi18n';

const OrderCell = ({ item }: { item: OrderListItem }) => {
  const customerLabel = item.customer_name || item.customer_email;

  return (
    <Flex direction="column" gap={1}>
      <Flex gap={1} align="center">
        <Text variant="tiny" color="subdued">
          {item.order_number}
        </Text>
        {item.is_manual ? (
          <Badge variant="secondary">{__('Manual Order', 'kirki-ecommerce')}</Badge>
        ) : null}
      </Flex>
      {customerLabel ? (
        <Text variant="tiny">
          {
            /* translators: %s: customer name */
            sprintf(__('by %s', 'kirki-ecommerce'), customerLabel)
          }
        </Text>
      ) : null}
    </Flex>
  );
};

OrderCell.displayName = 'OrderCell';

const orderColumns: ColumnDef<OrderListItem>[] = [
  {
    id: 'order_number',
    header: __('Order', 'kirki-ecommerce'),
    enableSorting: true,
    meta: { cssOverride: { width: '15%' } },
    cell: ({ row }) => <OrderCell item={row.original} />,
  },
  {
    id: 'quantity',
    header: __('Quantity', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => <Text variant="small">{row.original.quantity}</Text>,
  },
  {
    id: 'invoiced_total',
    header: __('Price', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => (
      <Text variant="small">{row.original.invoiced_total_money_object.display}</Text>
    ),
  },
  {
    id: 'status',
    header: __('Status', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => {
      const fulfillmentBadge = getFulfillmentBadgeInfo(row.original.fulfillment_status);
      const paymentBadge = getPaymentBadgeInfo(row.original.payment_status);
      return (
        <Flex gap={1} align="center">
          <Badge variant={paymentBadge.variant}>{paymentBadge.text}</Badge>
          <Badge variant={fulfillmentBadge.variant}>{fulfillmentBadge.text}</Badge>
        </Flex>
      );
    },
  },
  {
    id: 'payment_provider',
    header: __('Payment', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) =>
      row.original.payment_provider ? (
        <Flex align="center" gap={1}>
          {row.original.payment_provider_icon && (
            <Image
              src={row.original.payment_provider_icon}
              width={16}
              height={16}
              cssOverride={{ border: 'none' }}
            />
          )}
          <Text variant="tiny" color="primary" weight="medium">
            {row.original.payment_provider.toUpperCase()}
          </Text>
        </Flex>
      ) : null,
  },
  {
    id: 'created_at',
    header: __('Created at', 'kirki-ecommerce'),
    enableSorting: true,
    meta: {
      alignment: 'right',
      cssOverride: { width: '5%' },
    },
    cell: ({ row }) =>
      row.original.created_at
        ? format(new Date(row.original.created_at), DATE_FORMATS.HUMAN_READABLE)
        : '-',
  },
];

export { orderColumns };
