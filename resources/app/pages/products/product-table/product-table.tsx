import type { CSSObject } from '@emotion/react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import DataTable, {
  type DataTableBulkApplyPayload,
  type DataTableColumn,
} from '@/components/data-table';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Thumbnail from '@/components/ui/thumbnail';
import { endpoints } from '@/libs/endpoints';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { PaginatedData, ProductListItem } from '@/types';
import { getBadgeVariantForStatus } from '@/utils/badge-status';
import { __ } from '@/wpi18n';

import FilterPopup from '@/pages/products/product-table/filter-popup/filter-popup';
import ProductTableAction from '@/pages/products/product-table/product-table-action';
import ProductTableFilterAction from '@/pages/products/product-table/product-table-filter-action';
import { useBulkDeleteProductsMutation } from '@/services/product';
import { productListOptions } from '@/types/filters/product';

type ProductTableProps = {
  data?: PaginatedData<ProductListItem>;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

const ProductTitleCell = ({ item }: { item: ProductListItem }) => {
  const navigate = useNavigate();

  return (
    <Flex gap={3} align="center">
      <Thumbnail src={item?.image ?? undefined} size="small" />
      <span
        css={scoped(styles.clickable)}
        onClick={() => {
          navigate(endpoints.PRODUCT(item.id));
        }}
      >
        <span css={scoped(styles.mutedText)}>{item?.title} </span>
      </span>
    </Flex>
  );
};

/*
 * Module scope on purpose: a stable `columns` reference is what lets the
 * memoized table header sit out a search.
 */
const productColumns: DataTableColumn<ProductListItem>[] = [
  {
    title: __('Product', 'kirki-ecommerce'),
    renderItem: (item) => <ProductTitleCell item={item} />,
  },
  {
    title: __('SKU', 'kirki-ecommerce'),
    renderItem: (item) => item?.sku || '-',
  },
  {
    title: __('Inventory', 'kirki-ecommerce'),
    renderItem: (item) => item?.inventory,
  },
  {
    title: __('Price', 'kirki-ecommerce'),
    renderItem: (item) => item?.price,
  },
  {
    title: __('Status', 'kirki-ecommerce'),
    renderItem: (item) => (
      <Badge variant={getBadgeVariantForStatus(item?.status ?? '')}>
        {item?.status}
      </Badge>
    ),
  },
  {
    title: __('Date', 'kirki-ecommerce'),
    renderItem: (item) => item?.created_at,
  },
];

const productBulkActions = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce') },
];

const ProductTable = ({ data, isLoading, onPageChange }: ProductTableProps) => {
  const bulkDeleteMutation = useBulkDeleteProductsMutation();

  const handleBulkApply = useCallback(
    async (
      action: string,
      { selectedItems, isSelectAll }: DataTableBulkApplyPayload,
    ) => {
      if (action !== 'delete') {
        return;
      }

      if (isSelectAll) {
        await bulkDeleteMutation.mutateAsync({
          action: 'delete-all',
          ids: null,
        });
      } else {
        await bulkDeleteMutation.mutateAsync({
          action: 'delete',
          ids: selectedItems as number[],
        });
      }
    },
    [bulkDeleteMutation],
  );

  return (
    <DataTable
      listOptions={productListOptions}
      data={data}
      isLoading={isLoading}
      columns={productColumns}
      bulkActionOptions={productBulkActions}
      onBulkApply={handleBulkApply}
      onPageChange={onPageChange}
    >
      <DataTable.Action>
        <ProductTableAction />
      </DataTable.Action>
      <DataTable.FilterAction>
        <FilterPopup />
      </DataTable.FilterAction>
      <DataTable.FilterBar>
        <ProductTableFilterAction />
      </DataTable.FilterBar>
      <DataTable.Pagination />
    </DataTable>
  );
};

ProductTable.displayName = 'ProductTable';

export default ProductTable;

const styles = {
  clickable: ({
    cursor: 'pointer',
  } satisfies CSSObject),
  mutedText: ({
    color: theme.colors.text.subdued,
  } satisfies CSSObject),
};
