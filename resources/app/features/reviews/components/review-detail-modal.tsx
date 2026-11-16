import { format } from 'date-fns';
import { Check, Trash2, X } from 'lucide-react';

import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import type { Review, ReviewStatusType } from '@/features/reviews/schemas/review';
import { DATE_FORMATS } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

interface ReviewDetailModalProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: ReviewStatusType) => void;
  onDelete: (id: number) => void;
}

export const RatingStars = ({ rating, size = 16 }: { rating: number; size?: number }) => {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={star <= rating ? '#f59e0b' : 'none'}
          stroke={star <= rating ? '#f59e0b' : '#cbd5e1'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
};

export const ReviewDetailModal = ({
  review,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
}: ReviewDetailModalProps) => {
  if (!review) {
    return null;
  }

  const statusVariant =
    review.status === 'approved'
      ? 'success'
      : review.status === 'pending'
        ? 'warning'
        : 'secondary';

  const formattedDate = review.created_at
    ? format(new Date(review.created_at), DATE_FORMATS.HUMAN_READABLE_WITH_TIME)
    : '--';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent cssOverride={styles.modalContent}>
        <DialogHeader>
          <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: theme.spacing[8] }}>
            <DialogTitle>{__('Review Details', 'kirki-ecommerce')}</DialogTitle>
            <Badge variant={statusVariant}>{review.status.toUpperCase()}</Badge>
          </Flex>
          <DialogCloseButton onClick={onClose} />
        </DialogHeader>

        <DialogBody cssOverride={styles.modalBody}>
          <div css={styles.section}>
            <Text variant="small" weight="semibold" cssOverride={styles.label}>
              {__('Product', 'kirki-ecommerce')}
            </Text>
            <Text variant="paragraph">
              {review.product?.title || `${__('Product #', 'kirki-ecommerce')}${review.product_id}`}
            </Text>
          </div>

          <div css={styles.section}>
            <Text variant="small" weight="semibold" cssOverride={styles.label}>
              {__('Author', 'kirki-ecommerce')}
            </Text>
            <Flex gap={2} align="center">
              <Text variant="paragraph" weight="medium">
                {review.author_name}
              </Text>
              <Text variant="small" color="subdued">
                ({review.author_email})
              </Text>
              {review.is_verified_purchase && (
                <Badge variant="info" size="sm">
                  {__('Verified Buyer', 'kirki-ecommerce')}
                </Badge>
              )}
            </Flex>
          </div>

          <div css={styles.section}>
            <Text variant="small" weight="semibold" cssOverride={styles.label}>
              {__('Rating', 'kirki-ecommerce')}
            </Text>
            <Flex gap={2} align="center">
              <RatingStars rating={review.rating} size={18} />
              <Text variant="small" color="subdued">
                ({review.rating} / 5)
              </Text>
            </Flex>
          </div>

          <div css={styles.section}>
            <Text variant="small" weight="semibold" cssOverride={styles.label}>
              {__('Date', 'kirki-ecommerce')}
            </Text>
            <Text variant="paragraph">{formattedDate}</Text>
          </div>

          {review.title && (
            <div css={styles.section}>
              <Text variant="small" weight="semibold" cssOverride={styles.label}>
                {__('Review Title', 'kirki-ecommerce')}
              </Text>
              <Text variant="paragraph" weight="medium">
                {review.title}
              </Text>
            </div>
          )}

          <div css={styles.section}>
            <Text variant="small" weight="semibold" cssOverride={styles.label}>
              {__('Content', 'kirki-ecommerce')}
            </Text>
            <div css={styles.contentBox}>
              <Text variant="paragraph" cssOverride={styles.contentText}>
                {review.content}
              </Text>
            </div>
          </div>
        </DialogBody>

        <DialogFooter cssOverride={styles.modalFooter}>
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(review.id);
                onClose();
              }}
            >
              <Trash2 size={14} style={{ marginRight: 6 }} />
              {__('Delete Review', 'kirki-ecommerce')}
            </Button>

            <Flex gap={2}>
              {review.status !== 'approved' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onStatusChange(review.id, 'approved');
                    onClose();
                  }}
                >
                  <Check size={14} style={{ marginRight: 6 }} />
                  {__('Approve', 'kirki-ecommerce')}
                </Button>
              )}
              {review.status !== 'rejected' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onStatusChange(review.id, 'rejected');
                    onClose();
                  }}
                >
                  <X size={14} style={{ marginRight: 6 }} />
                  {__('Reject', 'kirki-ecommerce')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                {__('Close', 'kirki-ecommerce')}
              </Button>
            </Flex>
          </Flex>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const styles = defineStyles({
  modalContent: {
    maxWidth: '560px',
    width: '100%',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
    padding: theme.spacing[5],
  },
  modalFooter: {
    padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[1],
  },
  label: {
    color: theme.colors.text.subdued,
  },
  contentBox: {
    backgroundColor: theme.colors.background.surfaceAlt,
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border.default}`,
    maxHeight: '200px',
    overflowY: 'auto',
  },
  contentText: {
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  },
});
