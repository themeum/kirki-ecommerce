import type { ReactNode } from 'react';
import { Link } from 'react-router';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { CardMenu } from '@/features/analytics';
import OverviewTitle from '@/features/home/components/overview-title';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type OverviewCardProps = {
  title: string;
  info: string;
  actionLabel?: string;
  actionTo?: string;
  headerExtra?: ReactNode;
  onHide?: () => void;
  children: ReactNode;
};

const OverviewCard = (props: OverviewCardProps) => {
  const { title, info, actionLabel, actionTo, headerExtra, onHide, children } = props;

  return (
    <Card cssOverride={styles.card}>
      <Flex align="center" justify="space-between" gap={2}>
        <OverviewTitle info={info}>
          <Text variant="heading6" weight="semibold">
            {title}
          </Text>
        </OverviewTitle>
        <Flex align="center" gap={2}>
          {headerExtra}
          {actionLabel && actionTo && (
            <Button variant="ghost" size="sm" asChild data-overview-action="">
              <Link to={actionTo}>{actionLabel}</Link>
            </Button>
          )}
          {onHide && <CardMenu title={title} canHide onHide={onHide} />}
        </Flex>
      </Flex>
      {children}
    </Card>
  );
};

OverviewCard.displayName = 'OverviewCard';

export default OverviewCard;

const HIDDEN_PARTS = '& [data-overview-action], & [data-card-menu], & [data-tooltip]';

const styles = defineStyles({
  card: {
    padding: theme.spacing[4],
    gap: theme.spacing[2],
    overflow: 'hidden',
    [HIDDEN_PARTS]: {
      opacity: 0,
      transition: 'opacity 0.15s ease',
    },
    [[
      '&:hover [data-overview-action]',
      '&:focus-within [data-overview-action]',
      '&:hover [data-card-menu]',
      '&:focus-within [data-card-menu]',
      '& [data-card-menu][data-state="open"]',
      '&:hover [data-tooltip]',
    ].join(', ')]: {
      opacity: 1,
    },
    '@media (hover: none)': {
      [HIDDEN_PARTS]: {
        opacity: 1,
      },
    },
  },
});
