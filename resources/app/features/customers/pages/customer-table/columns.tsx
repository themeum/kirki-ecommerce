import type { ColumnDef } from '@tanstack/react-table';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import type { CustomerListItem } from '@/features/customers/schemas/catalog/customer';
import { displayMoney } from '@/utils/money';
import { __ } from '@/wpi18n';

const customerColumns: ColumnDef<CustomerListItem>[] = [
  {
    id: 'first_name',
    header: __('Customer', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => {
      const photo = row.original?.photo && typeof row.original.photo === 'object' ? row.original.photo : null;
      return (
        <Flex gap={3} align="center">
          <Thumbnail src={photo?.url} size="small" type="circle" />
          <Flex direction="column" gap={1}>
            <Text variant="tiny" weight="medium">
              {row.original?.first_name} {row.original?.last_name}
            </Text>
            <Text variant="tiny" color="secondary">
              {row.original?.email}
            </Text>
          </Flex>
        </Flex>
      );
    },
  },
  {
    id: 'orders_count',
    header: __('Orders', 'kirki-ecommerce'),
    enableSorting: false,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- a customer with 0 orders renders as '--' like the other empty cells in this row; ?? would print 0
    cell: ({ row }) => row.original?.orders_count || '--',
  },
  {
    id: 'base_amount_spent',
    header: __('Amount Spent', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => displayMoney('base_amount_spent', row.original),
  },
  {
    id: 'location',
    header: __('Location', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original?.location || '--',
  },
  {
    id: 'last_order_date',
    header: __('Last Order', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original?.last_order_date || '--',
  },
  {
    id: 'created_at',
    header: __('Joined at', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original?.created_at || '--',
  },
];

export { customerColumns };
