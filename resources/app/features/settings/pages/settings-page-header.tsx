import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SettingsPageHeaderProps = {
  icon?: ReactNode;
  title?: string;
  onBack?: () => void;
};

const SettingsPageHeader = (props: SettingsPageHeaderProps) => {
  const { icon, title, onBack } = props;

  return (
    <Flex align="center" justify="flex-start" gap={2} cssOverride={styles.wrapper}>
      {onBack && (
        <>
          <Button
            variant="tertiary"
            size="icon-sm"
            aria-label={__('Back', 'kirki-ecommerce')}
            onClick={onBack}
          >
            <ArrowLeft css={scoped({ minWidth: 16, minHeight: 16 })} />
          </Button>
        </>
      )}
      <Flex gap={2} align="center">
        {icon}
        <Text variant="heading6" weight="semibold">
          {title}
        </Text>
      </Flex>
    </Flex>
  );
};

SettingsPageHeader.displayName = 'SettingsPageHeader';

export default SettingsPageHeader;

const styles = defineStyles({
  wrapper: {
    width: '100%',
  },
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
