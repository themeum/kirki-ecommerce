import type { ColumnDef } from '@tanstack/react-table';
import { Check, Eye, Trash2, X } from 'lucide-react';

import type { DataTableBulkAction } from '@/components/data-table';
import { actionsColumnMeta } from '@/components/data-table/column-styles';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { RatingStars } from '@/features/reviews/components/rating-stars';
import type { Review, ReviewStatusType } from '@/features/reviews/schemas/review';
import { getStatusBadgeVariant } from '@/features/reviews/utils';
import { DATE_FORMATS, formatDateValue } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

export type ReviewColumnsOptions = {
  onView: (review: Review) => void;
  onStatusChange: (id: number, status: ReviewStatusType) => void;
  onDelete: (id: number) => void;
};

export const createReviewColumns = ({
  onView,
  onStatusChange,
  onDelete,
}: ReviewColumnsOptions): ColumnDef<Review>[] => [
  {
    id: 'product',
    header: __('Product', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => {
      const product = row.original.product;
      const title =
        product?.title || sprintf(__('Product #%s', 'kirki-ecommerce'), row.original.product_id);
      return (
        <Button
          variant="ghost"
          cssOverride={styles.clickable}
          onClick={() => onView(row.original)}
        >
          <Text variant="small" weight="medium">
            {title}
          </Text>
        </Button>
      );
    },
  },
  {
    id: 'author',
    header: __('Author', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => (
      <Flex direction="column" gap={1}>
        <Flex gap={2} align="center">
          <Text variant="small" weight="medium">
            {row.original.author_name}
          </Text>
          {row.original.is_verified_purchase && (
            <Badge variant="info" size="sm">
              {__('Verified', 'kirki-ecommerce')}
            </Badge>
          )}
        </Flex>
        <Text variant="tiny" cssOverride={styles.subText}>
          {row.original.author_email}
        </Text>
      </Flex>
    ),
  },
  {
    id: 'rating',
    header: __('Rating', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) => (
      <Flex align="center" gap={1}>
        <RatingStars rating={row.original.rating} size={14} />
      </Flex>
    ),
  },
  {
    id: 'review',
    header: __('Review', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => (
      <Flex direction="column" gap={1} cssOverride={styles.reviewCell}>
        {row.original.title && (
          <Text variant="small" weight="semibold" cssOverride={styles.reviewTitle}>
            {row.original.title}
          </Text>
        )}
        <Text variant="tiny" cssOverride={styles.reviewSnippet}>
          {row.original.content}
        </Text>
      </Flex>
    ),
  },
  {
    id: 'status',
    header: __('Status', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.original.status;
      const variant = getStatusBadgeVariant(status);
      return <Badge variant={variant}>{status.toUpperCase()}</Badge>;
    },
  },
  {
    id: 'created_at',
    header: __('Date', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) =>
      row.original.created_at
        ? formatDateValue(new Date(row.original.created_at), DATE_FORMATS.HUMAN_READABLE_SHORT)
        : '-',
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    meta: actionsColumnMeta,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <DataTableRowActions
          actions={[
            {
              label: __('View details', 'kirki-ecommerce'),
              icon: <Eye size={16} />,
              onClick: () => onView(item),
            },
            ...(item.status !== 'approved'
              ? [
                  {
                    label: __('Approve', 'kirki-ecommerce'),
                    icon: <Check size={16} />,
                    onClick: () => onStatusChange(item.id, 'approved'),
                  },
                ]
              : []),
            ...(item.status !== 'trash'
              ? [
                  {
                    label: __('Move to Trash', 'kirki-ecommerce'),
                    icon: <X size={16} />,
                    onClick: () => onStatusChange(item.id, 'trash'),
                  },
                ]
              : []),
            { label: '', type: 'separator' as const },
            {
              label: __('Delete', 'kirki-ecommerce'),
              icon: <Trash2 size={16} />,
              destructive: true,
              onClick: () => onDelete(item.id),
            },
          ]}
        />
      );
    },
  },
];

export const reviewBulkActions: DataTableBulkAction[] = [
  { value: 'approve', title: __('Approve', 'kirki-ecommerce') },
  { value: 'reject', title: __('Reject', 'kirki-ecommerce') },
  { value: 'delete', title: __('Delete', 'kirki-ecommerce'), destructive: true },
];

const styles = defineStyles({
  clickable: {
    padding: theme.spacing[0],
    height: 'auto',
    border: 'none',
    background: 'none',
    font: 'inherit',
    color: 'inherit',
    textAlign: 'left',
    cursor: 'pointer',
  },
  subText: {
    color: theme.colors.text.subdued,
  },
  reviewCell: {
    maxWidth: '280px',
  },
  reviewTitle: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  reviewSnippet: {
    color: theme.colors.text.subdued,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});
