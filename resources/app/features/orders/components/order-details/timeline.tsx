import { Trash2 } from 'lucide-react';
import type { KeyboardEvent } from 'react';

import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { createAcronym } from '@/utils';
import { __ } from '@/wpi18n';

type TimelineEntryType = 'comment' | 'event';

type TimelineEntry = {
  id: number;
  type: TimelineEntryType;
  message: string;
  time: string;
  author?: string;
};

const timelineEntries: TimelineEntry[] = [
  { id: 1, type: 'comment', author: 'Admin', message: 'This is the latest post.', time: '15 minutes ago' },
  { id: 2, type: 'comment', author: 'Admin', message: 'This is the latest post.', time: '15 minutes ago' },
  { id: 3, type: 'event', message: 'Order placed for Neuvlette #2231', time: '15 minutes ago' },
  { id: 4, type: 'event', message: 'Admin created this draft order.', time: '15 minutes ago' },
];

const handleSaveComment = (event: KeyboardEvent<HTMLInputElement>) => {
  if (event.key !== 'Enter') {
    return;
  }

  // console.log(event.currentTarget.value);
  // TODO: wire up comment persistence once the Timeline API is available.
};

const Timeline = () => {
  return (
    <Card cssOverride={cardStyles.formCard}>
      <CardHeader>
        <CardTitle>{__('Timeline', 'kirki-ecommerce')}</CardTitle>
      </CardHeader>
      <CardContent cssOverride={styles.content}>
        <Flex direction="column" gap={4}>
          <Input placeholder={__('Add a comment...', 'kirki-ecommerce')} onKeyDown={handleSaveComment} />

          <div css={scoped(styles.timelineList)}>
            <Flex direction="column" gap={3}>
              {timelineEntries.map((entry, index) => {
                const acronym = createAcronym({ first_name: entry.author });
                return (
                  entry.type === 'comment' ? (
                    <Flex key={index} gap={3} align="center" cssOverride={styles.commentRow}>
                      <div css={scoped(styles.leadingIcon)}>
                        <div css={scoped(styles.avatar)}>{acronym}</div>
                      </div>
                      <Flex direction="column" gap={1} grow={1}>
                        <Text variant="small" weight="medium">{entry.author}</Text>
                        <Text variant="small" color="secondary">{entry.message}</Text>
                      </Flex>
                      <Flex gap={2} align="center">
                        <Text variant="tiny" color="subdued" data-comment-time="true">{entry.time}</Text>
                        <Button variant="ghost" size="icon-sm" aria-label="Delete comment" data-action-group="true">
                          <Trash2 size={12} />
                        </Button>
                      </Flex>
                    </Flex>
                  ) : (
                    <Flex key={index} gap={3} align="center" cssOverride={styles.actionRow}>
                      <div css={scoped(styles.leadingIcon)}>
                        <span css={scoped(styles.eventIcon)} />
                      </div>
                      <Text variant="small" weight="medium" cssOverride={{ flexGrow: 1 }}>{entry.message}</Text>
                      <Text variant="tiny" color="subdued">{entry.time}</Text>
                    </Flex>
                  )
                )
              })}
            </Flex>
          </div>
        </Flex>
      </CardContent>
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
    ...flexCenter(),
    width: theme.spacing[8],
    height: theme.spacing[8],
    flexShrink: 0,
  },
  avatar: {
    ...flexCenter(),
    width: theme.spacing[8],
    height: theme.spacing[8],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surfaceSecondary,
    color: theme.colors.text.secondary,
    ...theme.typography.micro('medium'),
    position: 'relative',
    zIndex: 1,
  },
  eventIcon: {
    ...flexCenter(),
    width: theme.spacing[5],
    height: theme.spacing[5],
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fillSecondary,
    position: 'relative',
    zIndex: 1,
    '&::after': {
      content: '""',
      width: theme.spacing[2],
      height: theme.spacing[2],
      borderRadius: theme.radius.full,
      backgroundColor: theme.colors.text.primary,
    },
  },
  actionRow: {
    minHeight: theme.spacing[12],
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
