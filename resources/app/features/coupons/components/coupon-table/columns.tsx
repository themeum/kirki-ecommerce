import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Ban, Copy, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';

import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import { RouteConfig } from '@/config/route-config';
import { getCouponBadgeInfo } from '@/features/coupons/lib/coupon-badge';
import type { CouponListItem } from '@/features/coupons/schemas/catalog/coupon';
import { useCouponActionMutation, useDeleteCouponMutation } from '@/features/coupons/services/coupon';
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

CouponTitleCell.displayName = 'CouponTitleCell';

const CouponRowActionsCell = ({ item }: { item: CouponListItem }) => {
  const navigate = useNavigate();
  const couponActionMutation = useCouponActionMutation();
  const deleteMutation = useDeleteCouponMutation();

  return (
    <DataTableRowActions
      edit={{
        onClick: () => navigate(RouteConfig.Coupons.get('EditCoupon').buildLink({ id: item.id })),
      }}
      actions={[
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
      ]}
    />
  );
};

CouponRowActionsCell.displayName = 'CouponRowActionsCell';

const couponColumns: ColumnDef<CouponListItem>[] = [
  {
    id: 'title',
    header: __('Title', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => <CouponTitleCell item={row.original} />,
  },
  {
    id: 'status',
    header: __('Status', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => {
      const badge = getCouponBadgeInfo(row.original.status);
      return (
        <Badge variant={badge.variant}>
          {badge.text}
        </Badge>
      );
    },
  },
  {
    id: 'method',
    header: __('Method', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original.method,
  },
  {
    id: 'discount_type',
    header: __('Type', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original.discount_type,
  },
  {
    id: 'current_usage_count',
    header: __('Used', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => row.original.current_usage_count,
  },
  {
    id: 'created_at',
    header: __('Created at', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) =>
      row.original.created_at ? format(new Date(row.original.created_at), DATE_FORMATS.HUMAN_READABLE_SHORT) : '-',
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) => <CouponRowActionsCell item={row.original} />,
  },
];

const couponBulkActions = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce') },
];

export { couponBulkActions, couponColumns };

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
