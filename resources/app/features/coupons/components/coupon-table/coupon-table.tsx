import { useCallback } from 'react';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import type { CouponListFilter } from '@/features/coupons';
import { couponListOptions } from '@/features/coupons';
import {
  couponBulkActions,
  couponColumns,
} from '@/features/coupons/components/coupon-table/columns';
import CouponTableFilters from '@/features/coupons/components/coupon-table/coupon-table-filters';
import { useBulkDeleteCouponsMutation, useCouponsQuery } from '@/features/coupons/services/coupon';
import { useConfirmDelete, useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { __ } from '@/wpi18n';

const CouponTable = () => {
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams<CouponListFilter>(couponListOptions);

  const { data, isFetching } = useCouponsQuery(params);
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
        isLoading={isFetching}
        enableRowSelection
        selectionResetKey={selectionResetKey}
        bulkActions={couponBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        toolbar={<CouponTableFilters />}
      />
      {deleteConfirmation}
    </>
  );
};

CouponTable.displayName = 'CouponTable';

export default CouponTable;
