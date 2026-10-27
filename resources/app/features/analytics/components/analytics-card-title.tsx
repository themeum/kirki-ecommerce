import { Info } from 'lucide-react';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import { theme } from '@/theme';
import { defineStyles, scoped, uiFocusRing } from '@/theme/mixins';

type AnalyticsCardTitleProps = {
  title: string;
  info: string;
  variant?: 'label' | 'title';
};

const AnalyticsCardTitle = (props: AnalyticsCardTitleProps) => {
  const { title, info, variant = 'title' } = props;

  return (
    <Flex align="center" gap={1}>
      {variant === 'label' ? (
        <Text variant="small" color="subdued">
          {title}
        </Text>
      ) : (
        <Text variant="heading6">{title}</Text>
      )}
      <Tooltip tip={info} position="top">
        <button type="button" aria-label={info} css={scoped(styles.icon)}>
          <Info size={14} aria-hidden="true" />
        </button>
      </Tooltip>
    </Flex>
  );
};

AnalyticsCardTitle.displayName = 'AnalyticsCardTitle';

export default AnalyticsCardTitle;

const styles = defineStyles({
  icon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    margin: 0,
    border: 'none',
    borderRadius: theme.radius.full,
    background: 'transparent',
    color: theme.colors.icon.secondary,
    cursor: 'help',
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
  },
});
