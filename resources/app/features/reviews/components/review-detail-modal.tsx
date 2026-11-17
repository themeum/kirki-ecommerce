import { Check, Edit3, MessageSquare, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import Textarea from '@/components/ui/textarea';
import { RatingStars } from '@/features/reviews/components/rating-stars';
import type { Review, ReviewStatusType } from '@/features/reviews/schemas/review';
import {
  useReplyToReviewMutation,
  useUpdateReviewMutation,
} from '@/features/reviews/services/review';
import { getStatusBadgeVariant } from '@/features/reviews/utils';
import { DATE_FORMATS, formatDateValue } from '@/libs/date';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

export { RatingStars } from '@/features/reviews/components/rating-stars';

interface ReviewDetailModalProps {
  review: Review | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: number, status: ReviewStatusType) => void;
  onDelete: (id: number) => void;
}

export const ReviewDetailModal = ({
  review,
  isOpen,
  onClose,
  onStatusChange,
  onDelete,
}: ReviewDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(5);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [replyText, setReplyText] = useState('');

  const updateReviewMutation = useUpdateReviewMutation();
  const replyToReviewMutation = useReplyToReviewMutation();

  useEffect(() => {
    if (review) {
      setEditRating(review.rating);
      setEditTitle(review.title || '');
      setEditContent(review.content || '');
      setReplyText(review.admin_reply || '');
      setIsEditing(false);
    }
  }, [review]);

  if (!review) {
    return null;
  }

  const statusVariant = getStatusBadgeVariant(review.status);

  const formattedDate = review.created_at
    ? formatDateValue(new Date(review.created_at), DATE_FORMATS.HUMAN_READABLE_WITH_TIME)
    : '--';

  const handleSaveEdit = () => {
    updateReviewMutation.mutate(
      {
        id: review.id,
        data: {
          rating: editRating,
          title: editTitle?.trim(),
          content: editContent.trim(),
        },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleSaveReply = () => {
    if (!replyText.trim()) return;
    replyToReviewMutation.mutate({
      id: review.id,
      admin_reply: replyText.trim(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent cssOverride={styles.modalContent}>
        <DialogHeader>
          <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: theme.spacing[8] }}>
            <DialogTitle>{__('Review Details', 'kirki-ecommerce')}</DialogTitle>
            <Flex gap={2} align="center">
              <Badge variant={statusVariant}>{review.status.toUpperCase()}</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 size={13} style={{ marginRight: 4 }} />
                {isEditing ? __('Cancel', 'kirki-ecommerce') : __('Edit', 'kirki-ecommerce')}
              </Button>
            </Flex>
          </Flex>
          <DialogCloseButton onClick={onClose} />
        </DialogHeader>

        <DialogBody cssOverride={styles.modalBody}>
          <Flex direction="column" gap={1}>
            <Text variant="small" weight="semibold" cssOverride={styles.label}>
              {__('Product', 'kirki-ecommerce')}
            </Text>
            <Text variant="paragraph">
              {review.product?.title || `${__('Product #', 'kirki-ecommerce')}${review.product_id}`}
            </Text>
          </Flex>

          <Flex direction="column" gap={1}>
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
          </Flex>

          <Flex direction="column" gap={1}>
            <Text variant="small" weight="semibold" cssOverride={styles.label}>
              {__('Rating', 'kirki-ecommerce')}
            </Text>
            {isEditing ? (
              <Flex gap={2} align="center">
                <RatingStars rating={editRating} size={22} interactive onRate={setEditRating} />
                <Text variant="small">({editRating} / 5)</Text>
              </Flex>
            ) : (
              <Flex gap={2} align="center">
                <RatingStars rating={review.rating} size={18} />
                <Text variant="small" color="subdued">
                  ({review.rating} / 5)
                </Text>
                {isDefined(review.helpful_count) && review.helpful_count > 0 && (
                  <Badge variant="secondary" size="sm" style={{ marginLeft: 8 }}>
                    👍 {review.helpful_count} {__('helpful votes', 'kirki-ecommerce')}
                  </Badge>
                )}
              </Flex>
            )}
          </Flex>

          <Flex direction="column" gap={1}>
            <Text variant="small" weight="semibold" cssOverride={styles.label}>
              {__('Date', 'kirki-ecommerce')}
            </Text>
            <Text variant="paragraph">{formattedDate}</Text>
          </Flex>

          {/* Edit Mode vs View Mode */}
          {isEditing ? (
            <>
              <Flex direction="column" gap={1}>
                <Text variant="small" weight="semibold" cssOverride={styles.label}>
                  {__('Review Title', 'kirki-ecommerce')}
                </Text>
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </Flex>

              <Flex direction="column" gap={1}>
                <Text variant="small" weight="semibold" cssOverride={styles.label}>
                  {__('Review Content', 'kirki-ecommerce')}
                </Text>
                <Textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                />
              </Flex>

              <Flex justify="start">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveEdit}
                  loading={updateReviewMutation.isPending}
                >
                  {__('Save Review Changes', 'kirki-ecommerce')}
                </Button>
              </Flex>
            </>
          ) : (
            <>
              {review.title && (
                <Flex direction="column" gap={1}>
                  <Text variant="small" weight="semibold" cssOverride={styles.label}>
                    {__('Review Title', 'kirki-ecommerce')}
                  </Text>
                  <Text variant="paragraph" weight="medium">
                    {review.title}
                  </Text>
                </Flex>
              )}

              <Flex direction="column" gap={1}>
                <Text variant="small" weight="semibold" cssOverride={styles.label}>
                  {__('Content', 'kirki-ecommerce')}
                </Text>
                <div css={styles.contentBox}>
                  <Text variant="paragraph" cssOverride={styles.contentText}>
                    {review.content}
                  </Text>
                </div>
              </Flex>
            </>
          )}

          {/* Store Owner Reply Section */}
          <div css={styles.replyBox}>
            <Flex gap={2} align="center" style={{ marginBottom: theme.spacing[2] }}>
              <MessageSquare size={16} color={theme.colors.icon.brand} />
              <Text variant="small" weight="semibold">
                {__('Store Owner Public Response', 'kirki-ecommerce')}
              </Text>
              {review.admin_replied_at && (
                <Text variant="small" color="subdued">
                  ({__('Replied on', 'kirki-ecommerce')}{' '}
                  {formatDateValue(new Date(review.admin_replied_at), DATE_FORMATS.HUMAN_READABLE)})
                </Text>
              )}
            </Flex>
            <div style={{ marginBottom: theme.spacing[2] }}>
              <Textarea
                rows={3}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={__('Write an official response to this customer review...', 'kirki-ecommerce')}
              />
            </div>
            <Flex justify="start">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveReply}
                loading={replyToReviewMutation.isPending}
                disabled={!replyText.trim()}
              >
                {__('Save Response', 'kirki-ecommerce')}
              </Button>
            </Flex>
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
              {review.status !== 'trash' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    onStatusChange(review.id, 'trash');
                    onClose();
                  }}
                >
                  <X size={14} style={{ marginRight: 6 }} />
                  {__('Move to Trash', 'kirki-ecommerce')}
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
    maxWidth: '580px',
    width: '100%',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
    padding: theme.spacing[5],
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  modalFooter: {
    padding: `${theme.spacing[3]} ${theme.spacing[5]}`,
  },
  label: {
    color: theme.colors.text.subdued,
  },
  contentBox: {
    backgroundColor: theme.colors.background.surfaceAlt,
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border.default}`,
    maxHeight: '180px',
    overflowY: 'auto',
  },
  contentText: {
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  },
  replyBox: {
    backgroundColor: theme.colors.background.surfaceAlt,
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border.default}`,
    borderLeft: `3px solid ${theme.colors.background.fillBrand}`,
  },
});
