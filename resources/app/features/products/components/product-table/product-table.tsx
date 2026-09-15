import { useCallback, useMemo } from 'react';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import type { ProductListFilter } from '@/features/products';
import { productListOptions } from '@/features/products';
import { productColumns } from '@/features/products/components/product-table/columns';
import ProductTableFilters from '@/features/products/components/product-table/product-table-filters';
import {
  useBulkDeleteProductsMutation,
  useBulkRestoreProductsMutation,
  useBulkTrashProductsMutation,
  useProductsQuery,
} from '@/features/products/services/product';
import { useConfirmDelete, useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { resolveBulkRestorePayload } from '@/libs/bulk-restore';
import { resolveBulkTrashPayload } from '@/libs/bulk-trash';
import { __ } from '@/wpi18n';

const ProductTable = () => {
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams<ProductListFilter>(productListOptions);

  const { data, isFetching } = useProductsQuery(params);
  const bulkDeleteMutation = useBulkDeleteProductsMutation();
  const bulkTrashMutation = useBulkTrashProductsMutation();
  const bulkRestoreMutation = useBulkRestoreProductsMutation();
  const { confirmDeleteAsync, deleteConfirmation } = useConfirmDelete();

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      switch (action) {
        case 'delete':
          if (params.status !== 'trashed') {
            return;
          }

          if (
            !(await confirmDeleteAsync({
              title: __('Delete products permanently?', 'kirki-ecommerce'),
              description: __(
                'The selected products will be erased from the trash along with their variants. This cannot be undone.',
                'kirki-ecommerce',
              ),
              confirmText: __('Delete permanently', 'kirki-ecommerce'),
            }))
          ) {
            // Rejecting keeps the row selection so the action can be retried.
            throw new Error('Bulk delete cancelled');
          }

          await bulkDeleteMutation.mutateAsync(
            resolveBulkDeletePayload(isAllMatchingSelected, selectedIds, params),
          );
          return;
        case 'restore':
          if (params.status !== 'trashed') {
            return;
          }

          await bulkRestoreMutation.mutateAsync(
            resolveBulkRestorePayload(isAllMatchingSelected, selectedIds, params),
          );
          return;
        case 'trash':
          await bulkTrashMutation.mutateAsync(
            resolveBulkTrashPayload(isAllMatchingSelected, selectedIds, params),
          );
          return;
      }
    },
    [bulkDeleteMutation, bulkTrashMutation, bulkRestoreMutation, confirmDeleteAsync, params],
  );

  const productBulkActions = useMemo(
    () =>
      params.status === 'trashed'
        ? [
            { value: 'restore', title: __('Restore', 'kirki-ecommerce') },
            {
              value: 'delete',
              title: __('Delete Permanently', 'kirki-ecommerce'),
              destructive: true,
            },
          ]
        : [{ value: 'trash', title: __('Trash', 'kirki-ecommerce'), destructive: true }],
    [params.status],
  );

  return (
    <>
      <DataTable
        tableId="products"
        data={data?.results ?? []}
        total={data?.total}
        columns={productColumns}
        pageCount={data?.last_page ?? 0}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        isLoading={isFetching}
        enableRowSelection
        selectionResetKey={selectionResetKey}
        bulkActions={productBulkActions}
        onBulkApply={handleBulkApply}
        toolbar={<ProductTableFilters />}
      />
      {deleteConfirmation}
    </>
  );
};

ProductTable.displayName = 'ProductTable';

export default ProductTable;
