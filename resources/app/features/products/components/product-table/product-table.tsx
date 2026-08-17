import { useCallback } from 'react';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import type { ProductListFilter } from '@/features/products';
import { productListOptions } from '@/features/products';
import { productBulkActions, productColumns } from '@/features/products/components/product-table/columns';
import ProductTableFilterBar from '@/features/products/components/product-table/product-table-filter-bar';
import ProductTableFilters from '@/features/products/components/product-table/product-table-filters';
import { useBulkDeleteProductsMutation, useProductsQuery } from '@/features/products/services/product';
import { useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';

const ProductTable = () => {
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams<ProductListFilter>(productListOptions);

  const { data, isFetching } = useProductsQuery(params);
  const bulkDeleteMutation = useBulkDeleteProductsMutation();

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      await bulkDeleteMutation.mutateAsync(resolveBulkDeletePayload(isAllMatchingSelected, selectedIds));
    },
    [bulkDeleteMutation],
  );

  return (
    <DataTable
      data={data?.results ?? []}
      columns={productColumns}
      pageCount={data?.last_page ?? 0}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={isFetching}
      enableRowSelection
      selectionResetKey={selectionResetKey}
      bulkActionOptions={productBulkActions}
      onBulkApply={handleBulkApply}
      toolbar={<ProductTableFilters />}
      filterBar={<ProductTableFilterBar />}
    />
  );
};

ProductTable.displayName = 'ProductTable';

export default ProductTable;
