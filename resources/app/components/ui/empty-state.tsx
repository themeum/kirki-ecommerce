import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';

type EmptyStateProps = {
  icon?: ReactNode;
  text: string;
  description?: string;
  actions?: ReactNode;
  cssOverride?: CSSObject;
};

const EmptyState = (props: EmptyStateProps) => {
  const { icon, text, description, actions, cssOverride } = props;

  return (
    <Flex
      direction="column"
      align="center"
      gap={2}
      cssOverride={mergeCss(styles.container, cssOverride)}
    >
      {icon}
      <Flex direction="column" gap={1}>
        <Text
          variant="heading6"
          weight="semibold"
          cssOverride={icon ? styles.titleWithIcon : undefined}
        >
          {text}
        </Text>
        {description && (
          <Text variant="small" color="secondary" cssOverride={styles.description}>
            {description}
          </Text>
        )}
      </Flex>
      {actions && (
        <Flex align="center" justify="center" gap={3} cssOverride={styles.actions}>
          {actions}
        </Flex>
      )}
    </Flex>
  );
};

EmptyState.displayName = 'EmptyState';

export default EmptyState;
export type { EmptyStateProps };

const styles = defineStyles({
  container: {
    width: '100%',
    padding: `${theme.spacing[8]} ${theme.spacing[4]} ${theme.spacing[10]} ${theme.spacing[4]}`,
    textAlign: 'center',
  },
  titleWithIcon: {
    marginTop: theme.spacing[2],
  },
  description: {
    textAlign: 'center',
  },
  actions: {
    marginTop: theme.spacing[2],
  },
});
