import { format } from 'date-fns';
import { Ban, Copy, Trash2 } from 'lucide-react';
import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import DataTable, {
  type DataTableBulkApplyPayload,
  type DataTableColumn,
  type DataTableRowActionsResolver,
} from '@/components/data-table';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import { RouteConfig } from '@/config/route-config';
import type { CouponListFilter} from '@/features/coupons';
import { couponListOptions } from '@/features/coupons';
import { getCouponBadgeInfo } from '@/features/coupons/lib/coupon-badge';
import CouponTableFilter from '@/features/coupons/pages/coupon-table/coupon-table-filter';
import CouponTableFilterBar from '@/features/coupons/pages/coupon-table/coupon-table-filter-bar';
import FilterPopup from '@/features/coupons/pages/coupon-table/filter-popup/filter-popup';
import type { CouponListItem } from '@/features/coupons/schemas/catalog/coupon';
import { useBulkDeleteCouponsMutation, useCouponActionMutation, useCouponsQuery, useDeleteCouponMutation } from '@/features/coupons/services/coupon';
import { useListParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { DATE_FORMATS } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const CouponTitleCell = ({ item }: { item: CouponListItem }) => {
  const navigate = useNavigate();

  return (
    <Flex gap={3} align="center">
      <button
        type="button"
        css={scoped(styles.clickable)}
        onClick={() => {
          void navigate(RouteConfig.Coupons.get('EditCoupon').buildLink({ id: item.id }));
        }}
      >
        <span css={scoped(styles.mutedText)}>{item.title} </span>
      </button>
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
    renderItem: (item) => {
      const badge = getCouponBadgeInfo(item.status);
      return (
        <Badge variant={badge.variant}>
          {badge.text}
        </Badge>
      );
    },
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
    title: __('Used', 'kirki-ecommerce'),
    renderItem: (item) => item.current_usage_count,
  },
  {
    title: __('Created at', 'kirki-ecommerce'),
    renderItem: (item) => item.created_at ? format(new Date(item.created_at), DATE_FORMATS.YEAR_MONTH_DAY) : '-',
  },
];

const couponBulkActions = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce') },
];

const CouponTable = () => {
  const navigate = useNavigate();
  const bulkDeleteMutation = useBulkDeleteCouponsMutation();
  const deleteMutation = useDeleteCouponMutation();
  const couponActionMutation = useCouponActionMutation();

  const { params, setParam } = useListParams<CouponListFilter>(couponListOptions);

  const { data, isLoading } = useCouponsQuery(params);

  const handlePaginationChange = useCallback(
    (value: number) => {
      setParam('page', value);
    },
    [setParam],
  );

  const handleBulkApply = useCallback(
    async (action: string, { selectedItems, isSelectAll }: DataTableBulkApplyPayload) => {
      if (action !== 'delete') {
        return;
      }

      await bulkDeleteMutation.mutateAsync(resolveBulkDeletePayload(isSelectAll, selectedItems));
    },
    [bulkDeleteMutation],
  );

  const rowActions = useCallback<DataTableRowActionsResolver<CouponListItem>>(
    (item) => ({
      edit: {
        onClick: () => navigate(RouteConfig.Coupons.get('EditCoupon').buildLink({ id: item.id })),
      },
      actions: [
        {
          label: __('Duplicate', 'kirki-ecommerce'),
          icon: <Copy size={16} />,
          onClick: () => {
            void couponActionMutation.mutateAsync({
              id: item.id,
              action: 'duplicate',
            });
          },
        },
        {
          label: item?.is_active ? __('Deactivate', 'kirki-ecommerce') : __('Activate', 'kirki-ecommerce'),
          icon: <Ban size={16} />,
          onClick: () => {
            void couponActionMutation.mutateAsync({
              id: item.id,
              action: item?.is_active ? 'deactivate' : 'activate',
            });
          },
        },
        { label: '', type: 'separator' },
        {
          label: __('Delete', 'kirki-ecommerce'),
          icon: <Trash2 size={16} />,
          onClick: () => {
            void deleteMutation.mutateAsync(item.id);
          },
        },
      ],
    }),
    [navigate, deleteMutation, couponActionMutation],
  );

  return (
    <DataTable
      data={data}
      isLoading={isLoading}
      columns={couponColumns}
      rowActions={rowActions}
      bulkActionOptions={couponBulkActions}
      onBulkApply={handleBulkApply}
      onPageChange={handlePaginationChange}
    >
      <DataTable.Filter>
        <CouponTableFilter />
      </DataTable.Filter>
      <DataTable.SelectionFilter>
        <FilterPopup />
      </DataTable.SelectionFilter>
      <DataTable.FilterBar>
        <CouponTableFilterBar />
      </DataTable.FilterBar>
      <DataTable.Pagination />
    </DataTable>
  );
};

CouponTable.displayName = 'CouponTable';

export default CouponTable;

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
