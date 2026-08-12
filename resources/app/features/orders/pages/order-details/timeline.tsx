import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Input from '@/components/ui/input';
import Text from '@/components/ui/text';
import { TrashIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles, flexCenter, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const comments = [
  { id: 1, author: 'Admin', initials: 'CN', message: 'This is the latest post.', time: '15 minutes ago' },
  { id: 2, author: 'Admin', initials: 'CN', message: 'This is the latest post.', time: '15 minutes ago' },
];

const events = [
  { id: 1, message: 'Order placed for Neuvlette #2231', time: '15 minutes ago' },
  { id: 2, message: 'Admin created this draft order.', time: '15 minutes ago' },
];

const Timeline = () => {
  return (
    <Flex direction="column" gap={4}>
      <Input placeholder={__('Add a comment...', 'kirki-ecommerce')} />

      {comments.map((comment) => (
        <Flex key={comment.id} gap={3} align="flex-start">
          <div css={scoped(styles.avatar)}>{comment.initials}</div>
          <Flex direction="column" gap={1} grow={1}>
            <Text variant="small" weight="medium">{comment.author}</Text>
            <Text variant="small" color="secondary">{comment.message}</Text>
          </Flex>
          <Flex gap={2} align="center">
            <Text variant="tiny" color="subdued">{comment.time}</Text>
            <Button variant="secondary" size="icon-sm" aria-label="Delete comment">
              <TrashIcon />
            </Button>
          </Flex>
        </Flex>
      ))}

      {events.map((event) => (
        <Flex key={event.id} gap={3} align="center">
          <span css={scoped(styles.eventDot)} />
          <Text variant="small" cssOverride={{ flexGrow: 1 }}>{event.message}</Text>
          <Text variant="tiny" color="subdued">{event.time}</Text>
        </Flex>
      ))}
    </Flex>
  );
};

Timeline.displayName = 'Timeline';

export default Timeline;

const styles = defineStyles({
  avatar: {
    ...flexCenter(),
    width: '32px',
    height: '32px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.surfaceAlt,
    color: theme.colors.text.secondary,
    ...theme.typography.micro('medium'),
    flexShrink: 0,
  },
  eventDot: {
    width: '8px',
    height: '8px',
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.background.fillSecondary,
    border: `2px solid ${theme.colors.border.secondary}`,
    flexShrink: 0,
  },
});
