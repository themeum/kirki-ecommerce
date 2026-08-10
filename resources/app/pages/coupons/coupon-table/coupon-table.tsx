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
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { useListParams } from '@/hooks';
import { DATE_FORMATS } from '@/libs/date';
import CouponTableFilter from '@/pages/coupons/coupon-table/coupon-table-filter';
import CouponTableFilterBar from '@/pages/coupons/coupon-table/coupon-table-filter-bar';
import FilterPopup from '@/pages/coupons/coupon-table/filter-popup/filter-popup';
import { getCouponBadgeInfo } from '@/pages/coupons/edit-coupon/config/coupon-badge';
import { CouponListItem } from '@/schemas/catalog/coupon';
import { useBulkDeleteCouponsMutation, useCouponActionMutation, useCouponsQuery, useDeleteCouponMutation } from '@/services/coupon';
import { CouponListFilter, couponListOptions } from '@/types/filters/coupon';
import { format } from 'date-fns';

const CouponTitleCell = ({ item }: { item: CouponListItem }) => {
  const navigate = useNavigate();

  return (
    <Flex gap={3} align="center">
      <span
        css={scoped(styles.clickable)}
        onClick={() => {
          navigate(RouteConfig.Coupons.get('EditCoupon').buildLink({ id: item.id }));
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
    cursor: 'pointer',
  },
  mutedText: {
    color: theme.colors.text.subdued,
  },
});
