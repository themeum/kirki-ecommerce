import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type StepLayoutProps = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  footer: ReactNode;
  onBack?: () => void;
};

const StepLayout = ({ title, subtitle, children, footer, onBack }: StepLayoutProps) => {
  return (
    <Flex direction="column" gap={6} cssOverride={styles.root}>
      <Flex direction="column" gap={1}>
        <Flex gap={2} align="center">
          {onBack && (
            <Button
              variant="tertiary"
              size="icon-xs"
              aria-label={__('Back', 'kirki-ecommerce')}
              onClick={onBack}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
          )}
          <Text variant="heading4" weight="semibold">
            {title}
          </Text>
        </Flex>
        {subtitle && <Text color="secondary">{subtitle}</Text>}
      </Flex>
      <Flex direction="column" gap={5} cssOverride={styles.body}>
        {children}
      </Flex>
      <Flex direction="column" gap={3} cssOverride={styles.footer}>
        {footer}
      </Flex>
    </Flex>
  );
};

StepLayout.displayName = 'StepLayout';

export default StepLayout;

const styles = defineStyles({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingBottom: theme.spacing[6],
  },
  footer: {
    '& [data-slot="button"]': {
      width: '100%',
    },
  },
});
