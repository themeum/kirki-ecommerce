import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';

import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { getFulfillmentBadgeInfo, getPaymentBadgeInfo } from '@/features/orders/lib/order-badge';
import type { OrderListItem } from '@/features/orders/schemas/catalog/order';
import { DATE_FORMATS } from '@/libs/date';
import { __, sprintf } from '@/wpi18n';

const OrderCell = ({ item }: { item: OrderListItem }) => {
  const customerLabel = item.customer_name || item.customer_email;

  return (
    <Flex
      direction="column"
      gap={1}
    >
      <Flex gap={1} align="center" >
        <Text variant="tiny" color="subdued">{`#${item.order_number || item.id}`}</Text>
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
    enableSorting: false,
    meta: { cssOverride: { width: '10%' } },
    cell: ({ row }) => <OrderCell item={row.original} />,
  },
  {
    id: 'quantity',
    header: __('Quantity', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { alignment: 'center' },
    cell: ({ row }) => <Text variant="small">{row.original.quantity}</Text>,
  },
  {
    id: 'invoiced_total',
    header: __('Price', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { alignment: 'center' },
    cell: ({ row }) => <Text variant="small">{row.original.invoiced_total_money_object.display}</Text>,
  },
  {
    id: 'status',
    header: __('Status', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { alignment: 'center' },
    cell: ({ row }) => {
      const fulfillmentBadge = getFulfillmentBadgeInfo(row.original.fulfillment_status);
      const paymentBadge = getPaymentBadgeInfo(row.original.payment_status);
      return (
        <Flex gap={1} align="center"><Badge variant={paymentBadge.variant}>
          <Text variant="tiny">{paymentBadge.text}</Text>
        </Badge>
          <Badge variant={fulfillmentBadge.variant}>
            <Text variant="tiny">{fulfillmentBadge.text}</Text>
          </Badge>
        </Flex>
      );
    },
  },
  {
    id: 'payment_provider',
    header: __('Payment', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { alignment: 'center' },
    cell: ({ row }) =>
      row.original.payment_provider ? (
        <Text variant="tiny" color="subdued">{row.original.payment_provider.toUpperCase()}</Text>
      ) : null,
  },
  {
    id: 'created_at',
    header: __('Date', 'kirki-ecommerce'),
    enableSorting: false,
    meta: { alignment: 'center' },
    cell: ({ row }) =>
      row.original.created_at ? format(new Date(row.original.created_at), DATE_FORMATS.HUMAN_READABLE) : '-',
  },
];

export { orderColumns };
