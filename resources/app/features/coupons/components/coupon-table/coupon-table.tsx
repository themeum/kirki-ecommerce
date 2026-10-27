import { useCallback } from 'react';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable, { DataTableEmptyState } from '@/components/data-table';
import Button from '@/components/ui/button';
import type { CouponListFilter } from '@/features/coupons';
import { couponListOptions } from '@/features/coupons';
import {
  couponBulkActions,
  couponColumns,
} from '@/features/coupons/components/coupon-table/columns';
import CouponTableFilters from '@/features/coupons/components/coupon-table/coupon-table-filters';
import type { CouponListItem } from '@/features/coupons/schemas/catalog/coupon';
import { useBulkDeleteCouponsMutation } from '@/features/coupons/services/coupon';
import { useConfirmDelete, useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import type { ListingTableProps } from '@/types/pages/common';
import { __ } from '@/wpi18n';

const CouponTable = ({ data, isLoading = false }: ListingTableProps<CouponListItem>) => {
  const {
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    clearFilters,
  } = useDataTableParams<CouponListFilter>(couponListOptions);

  const bulkDeleteMutation = useBulkDeleteCouponsMutation();
  const { confirmDeleteAsync, deleteConfirmation } = useConfirmDelete();

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      if (
        !(await confirmDeleteAsync({
          title: __('Delete selected coupons?', 'kirki-ecommerce'),
          description: __(
            'The selected coupons will be permanently deleted and can no longer be redeemed at checkout. This cannot be undone.',
            'kirki-ecommerce',
          ),
        }))
      ) {
        // Rejecting keeps the row selection so the action can be retried.
        throw new Error('Bulk delete cancelled');
      }

      await bulkDeleteMutation.mutateAsync(
        resolveBulkDeletePayload(isAllMatchingSelected, selectedIds),
      );
    },
    [bulkDeleteMutation, confirmDeleteAsync],
  );

  return (
    <>
      <DataTable
        tableId="coupons"
        data={data?.results ?? []}
        columns={couponColumns}
        total={data?.total}
        pageCount={data?.last_page ?? 0}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        isLoading={isLoading}
        enableRowSelection
        selectionResetKey={selectionResetKey}
        bulkActions={couponBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        toolbar={<CouponTableFilters />}
        emptyState={
          <DataTableEmptyState
            title={__('No coupons found', 'kirki-ecommerce')}
            actions={
              <Button variant="secondary" onClick={clearFilters}>
                {__('Clear Search', 'kirki-ecommerce')}
              </Button>
            }
          />
        }
      />
      {deleteConfirmation}
    </>
  );
};

CouponTable.displayName = 'CouponTable';

export default CouponTable;
