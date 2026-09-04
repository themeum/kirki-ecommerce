import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { useNavigate } from 'react-router';

import Flex from '@/components/ui/flex';
import Image from '@/components/ui/image';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import { RouteConfig } from '@/config/route-config';
import {
  getAvailabilityColor,
  getAvailabilityDescription,
} from '@/features/products/lib/availability';
import type { ProductListItem, ProductStatus } from '@/features/products/schemas/catalog/product';
import { InfoIcon } from '@/icons';
import { DATE_FORMATS } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { displayMoney } from '@/utils/money';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const getStatusColor = (status: ProductStatus): keyof typeof theme.colors.text => {
  switch (status) {
    case 'draft':
      return 'secondary';
    case 'published':
      return 'success';
    case 'trashed':
      return 'critical';
  }
};

const ProductTitleCell = ({ item }: { item: ProductListItem }) => {
  const navigate = useNavigate();

  return (
    <Flex gap={3} align="center">
      <Image src={item?.image} size="sm" />
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

const STATUS_MAP = {
  draft: __('Draft', 'kirki-ecommerce'),
  published: __('Published', 'kirki-ecommerce'),
  trashed: __('Trashed', 'kirki-ecommerce'),
};

const productColumns: ColumnDef<ProductListItem>[] = [
  {
    id: 'title',
    header: __('Product', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => <ProductTitleCell item={row.original} />,
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

      const label = (
        <Text
          variant="tiny"
          color={getAvailabilityColor(status)}
          dangerouslySetInnerHTML={{ __html: row.original?.availability_label ?? status }}
          cssOverride={styles.availabilityLabel}
        />
      );

      const description = getAvailabilityDescription(status);

      if (!description) {
        return label;
      }

      return (
        <Flex
          align="center"
          gap={2}
          cssOverride={{
            '&:hover': {
              '& [data-tooltip]': {
                opacity: 1,
              },
            },
          }}
        >
          {label}
          <Tooltip
            tip={description}
            position="top"
            cssOverride={{ opacity: 0, transition: 'opacity 0.2s ease' }}
          >
            <InfoIcon />
          </Tooltip>
        </Flex>
      );
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
      <Text variant="tiny" color={getStatusColor(row.original.status)}>
        {isDefined(STATUS_MAP[row.original.status]) ? STATUS_MAP[row.original.status] : '--'}
      </Text>
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

export { productColumns };

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
  availabilityLabel: {
    '& span': {
      color: theme.colors.text.primary,
    },
  },
});
