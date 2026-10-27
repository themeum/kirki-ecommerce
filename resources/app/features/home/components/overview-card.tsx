import type { ReactNode } from 'react';
import { Link } from 'react-router';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import OverviewTitle from '@/features/home/components/overview-title';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type OverviewCardProps = {
  title: string;
  info: string;
  actionLabel: string;
  actionTo: string;
  children: ReactNode;
};

const OverviewCard = (props: OverviewCardProps) => {
  const { title, info, actionLabel, actionTo, children } = props;

  return (
    <Card cssOverride={styles.card}>
      <Flex align="center" justify="space-between" gap={2} cssOverride={styles.header}>
        <OverviewTitle info={info}>
          <Text variant="heading6" weight="semibold">
            {title}
          </Text>
        </OverviewTitle>
        <Button variant="ghost" size="sm" asChild data-overview-action="">
          <Link to={actionTo}>{actionLabel}</Link>
        </Button>
      </Flex>
      {children}
    </Card>
  );
};

OverviewCard.displayName = 'OverviewCard';

export default OverviewCard;

const ACTION_SELECTOR = '[data-overview-action]';
const INFO_SELECTOR = '[data-tooltip]';

const styles = defineStyles({
  card: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
    [`& ${ACTION_SELECTOR}, & ${INFO_SELECTOR}`]: {
      opacity: 0,
      transition: 'opacity 0.15s ease',
    },
    [`&:hover ${ACTION_SELECTOR}, &:focus-within ${ACTION_SELECTOR}, &:hover ${INFO_SELECTOR}`]: {
      opacity: 1,
    },
    '@media (hover: none)': {
      [`& ${ACTION_SELECTOR}, & ${INFO_SELECTOR}`]: {
        opacity: 1,
      },
    },
  },
  header: {
    minHeight: '60px',
    padding: `${theme.spacing[3]} ${theme.spacing[3]} ${theme.spacing[2]} ${theme.spacing[3]}`,
  },
});
