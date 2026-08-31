import { Trash2 } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';

import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import InfiniteScrollSentinel from '@/components/ui/infinite-scroll-sentinel';
import Input from '@/components/ui/input';
import LeadingIconBadge from '@/components/ui/leading-icon-badge';
import Text from '@/components/ui/text';
import type { ActivityFormPayload } from '@/features/orders/schemas/forms/activity-form';
import {
  useCreateOrderActivityMutation,
  useDeleteOrderActivityMutation,
  useOrderActivitiesInfiniteQuery,
} from '@/features/orders/services/activity';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { createAcronym } from '@/utils';
import { __ } from '@/wpi18n';

type TimelineProps = {
  orderId: number;
};

const Timeline = ({ orderId }: TimelineProps) => {
  const [message, setMessage] = useState('');
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrderActivitiesInfiniteQuery(orderId);
  const createActivityMutation = useCreateOrderActivityMutation();
  const deleteActivityMutation = useDeleteOrderActivityMutation();

  const activities = data?.pages.flatMap((page) => page.results) ?? [];

  const handleSaveComment = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    const trimmed = message.trim();
    if (!trimmed || createActivityMutation.isPending) {
      return;
    }

    createActivityMutation.mutate(
      { orderId, data: { message: trimmed } as ActivityFormPayload },
      { onSuccess: () => setMessage('') },
    );
  };

  const handleConfirmDelete = () => {
    if (pendingDeleteId === null) {
      return;
    }

    deleteActivityMutation.mutate(
      { orderId, activityId: pendingDeleteId },
      { onSuccess: () => setPendingDeleteId(null) },
    );
  };

  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Timeline', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent cssOverride={styles.content}>
        <Flex direction="column" gap={4}>
          <Input
            placeholder={__('Add a comment...', 'kirki-ecommerce')}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleSaveComment}
            disabled={createActivityMutation.isPending}
            cssOverride={{ zIndex: 1 }}
          />

          {isLoading && (
            <Text variant="small" color="secondary">
              {__('Loading activity...', 'kirki-ecommerce')}
            </Text>
          )}

          <div css={scoped(styles.timelineList)}>
            <Flex direction="column" gap={3}>
              {activities.map((entry) => {
                if (entry.activity_type === 'comment-added') {
                  const acronym = createAcronym({ first_name: entry.author_name ?? undefined });
                  return (
                    <Flex key={entry.id} gap={3} align="center" cssOverride={styles.commentRow}>
                      <Flex align="center" justify="center" cssOverride={styles.leadingIcon}>
                        <div css={scoped(styles.avatar)}>{acronym}</div>
                      </Flex>
                      <Flex direction="column" gap={1} grow={1}>
                        <Text variant="small" weight="medium">
                          {entry.author_name}
                        </Text>
                        <Text variant="small" color="secondary">
                          {entry.description}
                        </Text>
                      </Flex>
                      <Flex gap={2} align="center">
                        <Text variant="tiny" color="subdued" data-comment-time="true">
                          {entry.created_at}
                        </Text>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={__('Delete comment', 'kirki-ecommerce')}
                          data-action-group="true"
                          onClick={() => setPendingDeleteId(entry.id)}
                        >
                          <Trash2 size={12} />
                        </Button>
                      </Flex>
                    </Flex>
                  );
                }

                return (
                  <Flex key={entry.id} gap={3} align="center" cssOverride={styles.actionRow}>
                    <LeadingIconBadge cssOverride={styles.leadingIcon} />
                    <Text variant="small" weight="medium" cssOverride={{ flexGrow: 1 }}>
                      {entry.description}
                    </Text>
                    <Text variant="tiny" color="subdued">
                      {entry.created_at}
                    </Text>
                  </Flex>
                );
              })}
            </Flex>
          </div>
          <InfiniteScrollSentinel
            hasMore={hasNextPage}
            isLoading={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
        </Flex>
      </CardContent>

      {pendingDeleteId !== null && (
        <ConfirmationDialog
          variant="delete"
          title={__('Delete comment?', 'kirki-ecommerce')}
          subtitle={__(
            'This comment will be permanently removed from the order timeline.',
            'kirki-ecommerce',
          )}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </Card>
  );
};

Timeline.displayName = 'Timeline';

export default Timeline;

const styles = defineStyles({
  content: {
    paddingLeft: theme.spacing[4],
    paddingRight: theme.spacing[4],
  },
  timelineList: {
    position: 'relative',
    '&::before': {
      content: '""',
      position: 'absolute',
      left: theme.spacing[4],
      top: `-${theme.spacing[4]}`,
      bottom: theme.spacing[4],
      width: '1.5px',
      backgroundColor: theme.colors.border.default,
      zIndex: 0,
    },
  },
  leadingIcon: {
    width: '2rem',
    height: '2rem',
    flexShrink: 0,
  },
  avatar: {
    ...flexCenter(),
    width: '2rem',
    height: '2rem',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surfaceSecondary,
    color: theme.colors.text.secondary,
    ...theme.typography.micro('medium'),
    position: 'relative',
    zIndex: 1,
  },
  actionRow: {
    minHeight: '3rem',
  },
  commentRow: {
    position: 'relative',
    minHeight: '70px',
    padding: theme.spacing[3],
    marginInline: `-${theme.spacing[3]}`,
    borderRadius: theme.radius.lg,
    backgroundColor: 'transparent',
    '& [data-action-group="true"]': {
      display: 'none',
    },
    '&:hover': {
      backgroundColor: theme.colors.background.fillHover,
      '& [data-comment-time="true"]': {
        display: 'none',
      },
      '& [data-action-group="true"]': {
        display: 'flex',
      },
    },
  },
});
