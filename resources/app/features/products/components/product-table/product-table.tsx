import { format } from 'date-fns';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import DataTable, {
  type DataTableBulkApplyPayload,
  type DataTableColumn,
} from '@/components/data-table';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Thumbnail from '@/components/ui/thumbnail';
import { RouteConfig } from '@/config/route-config';
import type { ProductListFilter} from '@/features/products';
import { productListOptions } from '@/features/products';
import FilterPopup from '@/features/products/components/product-table/filter-popup/filter-popup';
import ProductTableFilter from '@/features/products/components/product-table/product-table-filter';
import ProductTableFilterBar from '@/features/products/components/product-table/product-table-filter-bar';
import type { ProductListItem } from '@/features/products/schemas/catalog/product';
import { useBulkDeleteProductsMutation, useProductsQuery } from '@/features/products/services/product';
import { useListParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { DATE_FORMATS } from '@/libs/date';
import { theme } from '@/theme';
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
    renderItem: (item) => isDefined(item.created_at) ? format(new Date(item.created_at), DATE_FORMATS.HUMAN_READABLE) : '',
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

      await bulkDeleteMutation.mutateAsync(resolveBulkDeletePayload(isSelectAll, selectedItems));
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
    padding: 0,
    border: 'none',
    background: 'none',
    font: 'inherit',
    color: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  mutedText: {
    color: theme.colors.text.subdued,
  },
});
