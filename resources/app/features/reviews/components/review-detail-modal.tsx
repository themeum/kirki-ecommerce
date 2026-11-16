import { format } from 'date-fns';
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
import Text from '@/components/ui/text';
import type { Review, ReviewStatusType } from '@/features/reviews/schemas/review';
import { useReplyToReviewMutation, useUpdateReviewMutation } from '@/features/reviews/services/review';
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

export const RatingStars = ({
  rating,
  size = 16,
  interactive = false,
  onRate,
}: {
  rating: number;
  size?: number;
  interactive?: boolean;
  onRate?: (val: number) => void;
}) => {
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
          style={{ cursor: interactive ? 'pointer' : 'default' }}
          onClick={() => interactive && onRate && onRate(star)}
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

  const statusVariant =
    review.status === 'approved'
      ? 'success'
      : review.status === 'pending'
        ? 'warning'
        : 'secondary';

  const formattedDate = review.created_at
    ? format(new Date(review.created_at), DATE_FORMATS.HUMAN_READABLE_WITH_TIME)
    : '--';

  const handleSaveEdit = () => {
    updateReviewMutation.mutate(
      {
        id: review.id,
        data: {
          rating: editRating,
          title: editTitle.trim() || undefined,
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
                {review.helpful_count > 0 && (
                  <Badge variant="secondary" size="sm" style={{ marginLeft: 8 }}>
                    👍 {review.helpful_count} {__('helpful votes', 'kirki-ecommerce')}
                  </Badge>
                )}
              </Flex>
            )}
          </div>

          <div css={styles.section}>
            <Text variant="small" weight="semibold" cssOverride={styles.label}>
              {__('Date', 'kirki-ecommerce')}
            </Text>
            <Text variant="paragraph">{formattedDate}</Text>
          </div>

          {/* Edit Mode vs View Mode */}
          {isEditing ? (
            <>
              <div css={styles.section}>
                <Text variant="small" weight="semibold" cssOverride={styles.label}>
                  {__('Review Title', 'kirki-ecommerce')}
                </Text>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  style={{
                    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: theme.radius.md,
                    fontSize: 14,
                  }}
                />
              </div>

              <div css={styles.section}>
                <Text variant="small" weight="semibold" cssOverride={styles.label}>
                  {__('Review Content', 'kirki-ecommerce')}
                </Text>
                <textarea
                  rows={4}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  style={{
                    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: theme.radius.md,
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEdit}
                disabled={updateReviewMutation.isPending}
                style={{ alignSelf: 'flex-start' }}
              >
                {updateReviewMutation.isPending ? __('Saving...', 'kirki-ecommerce') : __('Save Review Changes', 'kirki-ecommerce')}
              </Button>
            </>
          ) : (
            <>
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
            </>
          )}

          {/* Store Owner Reply Section */}
          <div css={styles.replyBox}>
            <Flex gap={2} align="center" style={{ marginBottom: theme.spacing[2] }}>
              <MessageSquare size={16} color="#2563eb" />
              <Text variant="small" weight="semibold">
                {__('Store Owner Public Response', 'kirki-ecommerce')}
              </Text>
              {review.admin_replied_at && (
                <Text variant="small" color="subdued">
                  ({__('Replied on', 'kirki-ecommerce')}{' '}
                  {format(new Date(review.admin_replied_at), DATE_FORMATS.HUMAN_READABLE)})
                </Text>
              )}
            </Flex>
            <textarea
              rows={3}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={__('Write an official response to this customer review...', 'kirki-ecommerce')}
              style={{
                width: '100%',
                padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: theme.radius.md,
                fontSize: 13,
                fontFamily: 'inherit',
                marginBottom: theme.spacing[2],
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveReply}
              disabled={replyToReviewMutation.isPending || !replyText.trim()}
            >
              {replyToReviewMutation.isPending ? __('Saving Reply...', 'kirki-ecommerce') : __('Save Response', 'kirki-ecommerce')}
            </Button>
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
    maxHeight: '180px',
    overflowY: 'auto',
  },
  contentText: {
    whiteSpace: 'pre-wrap',
    lineHeight: 1.5,
  },
  replyBox: {
    backgroundColor: '#f8fafc',
    padding: theme.spacing[3],
    borderRadius: theme.radius.md,
    border: `1px solid ${theme.colors.border.default}`,
    borderLeft: '3px solid #2563eb',
  },
});
