import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';

import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import { RouteConfig } from '@/config/route-config';
import { getAvailabilityColor } from '@/features/products/lib/availability';
import type { ProductListItem } from '@/features/products/schemas/catalog/product';
import { DATE_FORMATS } from '@/libs/date';
import { defineStyles, scoped } from '@/theme/mixins';
import { getBadgeVariantForStatus } from '@/utils/badge-status';
import { displayMoney } from '@/utils/money';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const ProductTitleCell = ({ item }: { item: ProductListItem }) => {
  const navigate = useNavigate();

  return (
    <Flex gap={3} align="center">
      <Thumbnail src={item?.image ?? undefined} size="small" />
      <button
        type="button"
        css={scoped(styles.clickable)}
        onClick={() => {
          void navigate(RouteConfig.Products.get('EditProduct').buildLink({ id: item.id }));
        }}
      >
        <Text variant="small">{item.title}</Text>
      </button>
    </Flex>
  );
};

ProductTitleCell.displayName = 'ProductTitleCell';

const productColumns: ColumnDef<ProductListItem>[] = [
  {
    id: 'title',
    header: __('Product', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => <ProductTitleCell item={row.original} />,
  },
  {
    id: 'sku',
    header: __('SKU', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original?.sku || '-',
  },
  {
    id: 'availability_status',
    header: __('Availability', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.original?.availability_status;

      if (!status) {
        return '-';
      }

      return <Text color={getAvailabilityColor(status)}>{row.original?.availability_label ?? status}</Text>;
    },
  },
  {
    id: 'base_price',
    header: __('Price', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => displayMoney('base_price', row.original),
  },
  {
    id: 'status',
    header: __('Status', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant={getBadgeVariantForStatus(row.original?.status ?? '')}>
        {row.original?.status}
      </Badge>
    ),
  },
  {
    id: 'created_at',
    header: __('Date', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) =>
      isDefined(row.original.created_at)
        ? format(new Date(row.original.created_at), DATE_FORMATS.HUMAN_READABLE)
        : '',
  },
];

const productBulkActions = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce') },
];

export { productBulkActions, productColumns };

const styles = defineStyles({
  clickable: {
    padding: 0,
    border: 'none',
    background: 'none',
    font: 'inherit',
    color: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
});
