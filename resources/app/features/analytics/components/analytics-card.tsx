import type { CSSObject } from '@emotion/react';
import { type ReactNode, useContext, useState } from 'react';

import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import AnalyticsCardTitle from '@/features/analytics/components/analytics-card-title';
import CardMenu, { CardMenuContext } from '@/features/analytics/components/card-menu';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';

type AnalyticsCardProps = {
  title: string;
  info: string;
  children?: ReactNode;
  testId?: string;
  size?: 'half' | 'full';
  titleVariant?: 'label' | 'title';
  cssOverride?: CSSObject;
};

const AnalyticsCard = (props: AnalyticsCardProps) => {
  const {
    title,
    info,
    children,
    testId,
    size = 'half',
    titleVariant = 'title',
    cssOverride,
  } = props;

  const [hasFocus, setHasFocus] = useState(false);
  const menu = useContext(CardMenuContext);

  return (
    <Card
      data-testid={testId}
      data-size={size}
      data-focused={hasFocus ? 'true' : undefined}
      onFocus={() => setHasFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setHasFocus(false);
        }
      }}
      cssOverride={mergeCss(styles.card, size === 'full' && styles.full, cssOverride)}
    >
      {menu ? (
        <Flex align="center" gap={2}>
          <AnalyticsCardTitle title={title} info={info} variant={titleVariant} />
          <CardMenu title={title} canHide={menu.canHide} onHide={menu.onHide} />
        </Flex>
      ) : (
        <AnalyticsCardTitle title={title} info={info} variant={titleVariant} />
      )}
      {children}
    </Card>
  );
};

AnalyticsCard.displayName = 'AnalyticsCard';

export default AnalyticsCard;

const styles = defineStyles({
  card: {
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    minWidth: 0,
    boxSizing: 'border-box',
    flex: '1 1 calc(50% - 8px)',
    '& [data-tooltip], & [data-card-menu]': {
      opacity: 0,
      transition: 'opacity 0.15s ease',
    },
    '&:hover [data-tooltip], &:hover [data-card-menu]': {
      opacity: 1,
    },
    '&[data-focused="true"] [data-tooltip], &[data-focused="true"] [data-card-menu]': {
      opacity: 1,
    },
    '& [data-card-menu][data-state="open"]': {
      opacity: 1,
    },
    '@media (hover: none)': {
      '& [data-tooltip], & [data-card-menu]': {
        opacity: 1,
      },
    },
    '@media (max-width: 719px)': {
      flexBasis: '100%',
    },
  },
  full: {
    flexBasis: '100%',
  },
});
