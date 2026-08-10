import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';

type EmptyStateProps = {
  icon?: ReactNode;
  text: string;
  cssOverride?: CSSObject;
};

const EmptyState = (props: EmptyStateProps) => {
  const { icon, text, cssOverride } = props;

  return (
    <Card cssOverride={mergeCss(cardStyles.innerDarkCard, cssOverride)}>
      <CardContent
        cssOverride={mergeCss(cardStyles.innerDarkContent, styles.content)}
      >
        <Flex direction="column" gap={2} align="center">
          {icon}
          <Text variant="small" color="subdued">
            {text}
          </Text>
        </Flex>
      </CardContent>
    </Card>
  );
};

EmptyState.displayName = 'EmptyState';

export default EmptyState;
export type { EmptyStateProps };

const styles = defineStyles({
  content: {
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  },
});
