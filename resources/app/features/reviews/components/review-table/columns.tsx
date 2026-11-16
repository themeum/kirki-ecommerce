import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Check, Eye, Trash2, X } from 'lucide-react';

import type { DataTableBulkAction } from '@/components/data-table';
import { actionsColumnMeta } from '@/components/data-table/column-styles';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { RatingStars } from '@/features/reviews/components/review-detail-modal';
import type { Review, ReviewStatusType } from '@/features/reviews/schemas/review';
import { DATE_FORMATS } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

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
      const title = product?.title || `${__('Product #', 'kirki-ecommerce')}${row.original.product_id}`;
      return (
        <button
          type="button"
          css={scoped(styles.clickable)}
          onClick={() => onView(row.original)}
        >
          <Text variant="small" weight="medium">
            {title}
          </Text>
        </button>
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
      <div css={styles.reviewCell}>
        {row.original.title && (
          <Text variant="small" weight="semibold" cssOverride={styles.reviewTitle}>
            {row.original.title}
          </Text>
        )}
        <Text variant="tiny" cssOverride={styles.reviewSnippet}>
          {row.original.content}
        </Text>
      </div>
    ),
  },
  {
    id: 'status',
    header: __('Status', 'kirki-ecommerce'),
    enableSorting: false,
    cell: ({ row }) => {
      const status = row.original.status;
      const variant =
        status === 'approved'
          ? 'success'
          : status === 'pending'
            ? 'warning'
            : 'secondary';
      return <Badge variant={variant}>{status.toUpperCase()}</Badge>;
    },
  },
  {
    id: 'created_at',
    header: __('Date', 'kirki-ecommerce'),
    enableSorting: true,
    cell: ({ row }) =>
      row.original.created_at
        ? format(new Date(row.original.created_at), DATE_FORMATS.HUMAN_READABLE_SHORT)
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
    padding: 0,
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
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1],
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
