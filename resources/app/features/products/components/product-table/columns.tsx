import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Copy, Eye, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';

import { actionsColumnMeta } from '@/components/data-table/column-styles';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
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
import {
  useBulkRestoreProductsMutation,
  useBulkTrashProductsMutation,
  useDuplicateProductMutation,
} from '@/features/products/services/product';
import { InfoIcon } from '@/icons/common';
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
    case 'scheduled':
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

const ProductActionsCell = ({ item }: { item: ProductListItem }) => {
  const navigate = useNavigate();
  const duplicateMutation = useDuplicateProductMutation();
  const trashMutation = useBulkTrashProductsMutation();
  const restoreMutation = useBulkRestoreProductsMutation();
  const previewUrl = item.preview_url;

  const handleDuplicate = async () => {
    const response = await duplicateMutation.mutateAsync(item.id);

    if (isDefined(response.data.id)) {
      void navigate(RouteConfig.Products.get('EditProduct').buildLink({ id: response.data.id }));
    }
  };

  return (
    <div role="presentation" onClick={(event) => event.stopPropagation()}>
      <DataTableRowActions
        edit={{
          onClick: () => {
            void navigate(RouteConfig.Products.get('EditProduct').buildLink({ id: item.id }));
          },
        }}
        actions={[
          ...(isDefined(previewUrl)
            ? [
                {
                  label: __('Preview', 'kirki-ecommerce'),
                  icon: <Eye size={16} />,
                  onClick: () => {
                    window.open(previewUrl, '_blank');
                  },
                },
              ]
            : []),
          {
            label: __('Duplicate', 'kirki-ecommerce'),
            icon: <Copy size={16} />,
            onClick: () => {
              void handleDuplicate();
            },
          },
          item.status === 'trashed'
            ? {
                label: __('Restore', 'kirki-ecommerce'),
                icon: <RotateCcw size={16} />,
                onClick: () => restoreMutation.mutate({ action: 'restore', ids: [item.id] }),
              }
            : {
                label: __('Move to trash', 'kirki-ecommerce'),
                icon: <Trash2 size={16} />,
                destructive: true,
                onClick: () => trashMutation.mutate({ ids: [item.id] }),
              },
        ]}
      />
    </div>
  );
};

ProductActionsCell.displayName = 'ProductActionsCell';

const STATUS_MAP = {
  draft: __('Draft', 'kirki-ecommerce'),
  published: __('Published', 'kirki-ecommerce'),
  scheduled: __('Scheduled', 'kirki-ecommerce'),
  trashed: __('Trashed', 'kirki-ecommerce'),
};

const productColumns: ColumnDef<ProductListItem>[] = [
  {
    id: 'title',
    header: __('Product', 'kirki-ecommerce'),
    enableSorting: true,
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
          weight="medium"
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
    enableSorting: true,
    cell: ({ row }) =>
      isDefined(row.original.base_sale_price)
        ? displayMoney('base_sale_price', row.original)
        : displayMoney('base_price', row.original),
  },
  {
    id: 'status',
    header: __('Status', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => (
      <Text variant="tiny" color={getStatusColor(row.original.status)}>
        {isDefined(STATUS_MAP[row.original.status]) ? STATUS_MAP[row.original.status] : '--'}
      </Text>
    ),
  },
  {
    id: 'created_at',
    header: __('Date', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) =>
      isDefined(row.original.created_at)
        ? format(new Date(row.original.created_at), DATE_FORMATS.HUMAN_READABLE)
        : '',
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    meta: actionsColumnMeta,
    cell: ({ row }) => <ProductActionsCell item={row.original} />,
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
      color: theme.colors.text.secondary,
    },
  },
});
