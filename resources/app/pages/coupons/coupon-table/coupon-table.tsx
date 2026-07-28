import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import DataTable, {
  type DataTableBulkApplyPayload,
  type DataTableColumn,
} from '@/components/data-table';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import { endpoints } from '@/libs/endpoints';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import type { PaginatedData } from '@/types';
import { getBadgeVariantForStatus } from '@/utils/badge-status';
import { __ } from '@/wpi18n';

import CouponTableAction from '@/pages/coupons/coupon-table/coupon-table-action';
import CouponTableFilterAction from '@/pages/coupons/coupon-table/coupon-table-filter-action';
import FilterPopup from '@/pages/coupons/coupon-table/filter-popup/filter-popup';
import { CouponListItem } from '@/schemas/catalog/coupon';
import { useBulkDeleteCouponsMutation } from '@/services/coupon';
import { couponListOptions } from '@/types/filters/coupon';

type CouponTableProps = {
  data?: PaginatedData<CouponListItem>;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
};

const CouponTitleCell = ({ item }: { item: CouponListItem }) => {
  const navigate = useNavigate();

  return (
    <Flex gap={3} align="center">
      <span
        css={styles.clickable}
        onClick={() => {
          navigate(endpoints.COUPON(item.id));
        }}
      >
        <span css={styles.mutedText}>{item.title} </span>
      </span>
    </Flex>
  );
};

/*
 * Module scope on purpose: a stable `columns` reference is what lets the
 * memoized table header sit out a search.
 */
const couponColumns: DataTableColumn<CouponListItem>[] = [
  {
    title: __('Title', 'kirki-ecommerce'),
    renderItem: (item) => <CouponTitleCell item={item} />,
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
    title: __('Method', 'kirki-ecommerce'),
    renderItem: (item) => item.method,
  },
  {
    title: __('Type', 'kirki-ecommerce'),
    renderItem: (item) => item.discount_type,
  },
  {
    title: __('used', 'kirki-ecommerce'),
    renderItem: (item) => item.current_usage_count,
  },
  {
    title: __('Created at', 'kirki-ecommerce'),
    renderItem: (item) => item?.created_at,
  },
];

const couponBulkActions = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce') },
];

const CouponTable = ({ data, isLoading, onPageChange }: CouponTableProps) => {
  const bulkDeleteMutation = useBulkDeleteCouponsMutation();

  const handleBulkApply = useCallback(
    async (action: string, { selectedItems, isSelectAll }: DataTableBulkApplyPayload) => {
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
      listOptions={couponListOptions}
      data={data}
      isLoading={isLoading}
      columns={couponColumns}
      bulkActionOptions={couponBulkActions}
      onBulkApply={handleBulkApply}
      onPageChange={onPageChange}
    >
      <DataTable.Action>
        <CouponTableAction />
      </DataTable.Action>
      <DataTable.FilterAction>
        <FilterPopup />
      </DataTable.FilterAction>
      <DataTable.FilterBar>
        <CouponTableFilterAction />
      </DataTable.FilterBar>
      <DataTable.Pagination />
    </DataTable>
  );
};

CouponTable.displayName = 'CouponTable';

export default CouponTable;

const styles = {
  clickable: scoped({
    cursor: 'pointer',
  }),
  mutedText: scoped({
    color: theme.colors.text.subdued,
  }),
};
