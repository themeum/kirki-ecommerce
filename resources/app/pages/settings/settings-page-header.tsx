import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';
import { ArrowLeft } from 'lucide-react';

type SettingsPageHeaderProps = {
  icon?: ReactNode;
  title?: string;
  onBack?: () => void;
  rightAction?: ReactNode;
};

const SettingsPageHeader = (props: SettingsPageHeaderProps) => {
  const { icon, title, onBack, rightAction } = props;

  return (
    <Flex align="center" justify="center">
      {onBack && (
        <>
          <Button
            variant="ghost"
            aria-label={__('Back', 'kirki-ecommerce')}
            onClick={onBack}
            cssOverride={styles.backButton}
          >
            <ArrowLeft css={scoped({ minWidth: 16, minHeight: 16 })} />
          </Button>
          <div css={scoped(styles.connector)} />
        </>
      )}
      <Card cssOverride={cardStyles.navbarCard}>
        <Flex gap={2} align="center">
          {icon}
          <Text variant='heading6' weight="semibold">{title}</Text>
        </Flex>
        {rightAction}
      </Card>
    </Flex>
  );
};

SettingsPageHeader.displayName = 'SettingsPageHeader';

export default SettingsPageHeader;

const styles = defineStyles({
  backButton: {
    height: '36px',
    width: '36px',
    background: theme.colors.background.surface,
    transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
    '&:hover': {
      'svg path': {
        stroke: theme.colors.background.fillBrand,
        strokeWidth: 1.5,
      },
    },
  },
  connector: {
    height: '19px',
    width: '8.5px',
    background: theme.colors.background.surface,
    clipPath: "path('M0,0 Q4.25,6 8.5,0 L8.5,19 Q4.25,13 0,19 Z')",
  },
});
