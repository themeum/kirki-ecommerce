import type { ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type MigrationStepLayoutProps = {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

const MigrationStepLayout = ({ title, subtitle, children, footer }: MigrationStepLayoutProps) => {
  return (
    <Flex direction="column" gap={6} cssOverride={styles.root}>
      {title && (
        <Flex direction="column" gap={1}>
          <Text variant="heading4" weight="semibold">
            {title}
          </Text>
          {subtitle && <Text color="secondary">{subtitle}</Text>}
        </Flex>
      )}
      <Flex direction="column" gap={4} cssOverride={styles.body}>
        {children}
      </Flex>
      {footer && (
        <Flex direction="column" gap={3} cssOverride={styles.footer}>
          {footer}
        </Flex>
      )}
    </Flex>
  );
};

MigrationStepLayout.displayName = 'MigrationStepLayout';

export default MigrationStepLayout;

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
