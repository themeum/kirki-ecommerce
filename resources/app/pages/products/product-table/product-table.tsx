import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import DataTable, {
  type DataTableBulkApplyPayload,
  type DataTableColumn,
} from '@/components/data-table';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Thumbnail from '@/components/ui/thumbnail';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import type { ProductListItem } from '@/types';
import { getBadgeVariantForStatus } from '@/utils/badge-status';
import { __ } from '@/wpi18n';

import { useListParams } from '@/hooks';
import FilterPopup from '@/pages/products/product-table/filter-popup/filter-popup';
import ProductTableFilter from '@/pages/products/product-table/product-table-filter';
import ProductTableFilterBar from '@/pages/products/product-table/product-table-filter-bar';
import { useBulkDeleteProductsMutation, useProductsQuery } from '@/services/product';
import { ProductListFilter, productListOptions } from '@/types/filters/product';
import { displayMoney } from '@/utils/money';

const ProductTitleCell = ({ item }: { item: ProductListItem }) => {
  const navigate = useNavigate();

  return (
    <Flex gap={3} align="center">
      <Thumbnail src={item?.image ?? undefined} size="small" />
      <span
        css={scoped(styles.clickable)}
        onClick={() => {
          navigate(`/products/${item.id}`);
        }}
      >
        <span css={scoped(styles.mutedText)}>{item.title} </span>
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
    renderItem: (item) => displayMoney('base_price', item),
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

const ProductTable = () => {
  const { params, setParam } =
    useListParams<ProductListFilter>(productListOptions);
  const bulkDeleteMutation = useBulkDeleteProductsMutation();

  const { data, isLoading } = useProductsQuery(params);

  const handlePaginationChange = useCallback(
    (value: number) => {
      setParam('page', value);
    },
    [setParam],
  );

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
      data={data}
      isLoading={isLoading}
      columns={productColumns}
      bulkActionOptions={productBulkActions}
      onBulkApply={handleBulkApply}
      onPageChange={handlePaginationChange}
    >
      <DataTable.Filter>
        <ProductTableFilter />
      </DataTable.Filter>
      <DataTable.SelectionFilter>
        <FilterPopup />
      </DataTable.SelectionFilter>
      <DataTable.FilterBar>
        <ProductTableFilterBar />
      </DataTable.FilterBar>
      <DataTable.Pagination />
    </DataTable>
  );
};

ProductTable.displayName = 'ProductTable';

export default ProductTable;

const styles = defineStyles({
  clickable: {
    cursor: 'pointer',
  },
  mutedText: {
    color: theme.colors.text.subdued,
  },
});
