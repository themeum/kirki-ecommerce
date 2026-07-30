import type { CSSObject } from '@emotion/react';
import type { CSSProperties, ReactNode } from 'react';

import Button from '@/components/ui/button';
import { ArrowLeftIcon } from '@/icons';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type PageNavbarProps = {
  buttonIcon?: ReactNode;
  handleBack?: () => void;
  textIcon?: ReactNode;
  text?: string;
  style?: CSSProperties;
  rightAction?: ReactNode;
};

const PageNavbar = (props: PageNavbarProps) => {
  const {
    buttonIcon = <ArrowLeftIcon />,
    handleBack,
    textIcon,
    text,
    style = {},
    rightAction,
  } = props;

  return (
    <div style={style}>
      <Flex align="center" justify="center">
        <Button
          variant="ghost"
          aria-label={__('Back', 'kirki-ecommerce')}
          onClick={handleBack ?? (() => window.history.back())}
          cssOverride={styles.backButton}
        >
          {buttonIcon}
        </Button>
        <div css={scoped(styles.connector)} />
        <Card cssOverride={cardStyles.navbarCard}>
          <Flex gap={2} align="center">
            {textIcon}
            <Text weight="semibold">{text}</Text>
          </Flex>
          {rightAction}
        </Card>
      </Flex>
    </div>
  );
};

PageNavbar.displayName = 'PageNavbar';

export default PageNavbar;

const styles = {
  backButton: ({
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
  } satisfies CSSObject),
  connector: ({
    height: '19px',
    width: '8.5px',
    background: theme.colors.background.surface,
    clipPath: "path('M0,0 Q4.25,6 8.5,0 L8.5,19 Q4.25,13 0,19 Z')",
  } satisfies CSSObject),
};
