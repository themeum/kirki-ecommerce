import { useCallback } from 'react';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import type { CouponListFilter } from '@/features/coupons';
import { couponListOptions } from '@/features/coupons';
import { couponBulkActions, couponColumns } from '@/features/coupons/pages/coupon-table/columns';
import CouponTableFilterBar from '@/features/coupons/pages/coupon-table/coupon-table-filter-bar';
import CouponTableFilters from '@/features/coupons/pages/coupon-table/coupon-table-filters';
import { useBulkDeleteCouponsMutation, useCouponsQuery } from '@/features/coupons/services/coupon';
import { useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';

const CouponTable = () => {
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams<CouponListFilter>(couponListOptions);

  const { data, isFetching } = useCouponsQuery(params);
  const bulkDeleteMutation = useBulkDeleteCouponsMutation();

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
      columns={couponColumns}
      pageCount={data?.last_page ?? 0}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={isFetching}
      enableRowSelection
      selectionResetKey={selectionResetKey}
      bulkActionOptions={couponBulkActions}
      onBulkApply={handleBulkApply}
      columnPinning={{ right: ['actions'] }}
      toolbar={<CouponTableFilters />}
      filterBar={<CouponTableFilterBar />}
    />
  );
};

CouponTable.displayName = 'CouponTable';

export default CouponTable;
