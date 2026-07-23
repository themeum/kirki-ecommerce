import { css } from '@emotion/react';
import type { CSSProperties, ReactNode } from 'react';

import Button from '@/components/ui/button';
import { ArrowLeftIcon } from '@/icons';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const backButtonCss = css({
  height: '36px',
  width: '36px',
  background: 'white',
  transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
  '&:hover': {
    'svg path': {
      stroke: theme.colors.background.fillBrand,
      strokeWidth: 1.5,
    },
  },
});

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
      <Flex style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Button
          size="sm"
          variant="ghost"
          aria-label={__('Back', 'kirki-ecommerce')}
          onClick={handleBack ?? (() => window.history.back())}
          css={backButtonCss}
        >
          {buttonIcon}
        </Button>
        <div
          style={{
            height: '19px',
            width: '8.5px',
            background: 'white',
            clipPath: "path('M0,0 Q4.25,6 8.5,0 L8.5,19 Q4.25,13 0,19 Z')",
          }}
        ></div>
        <Card css={styles.navbarCard}>
          <Text type="primary" header={text} leftIcon={textIcon} />
          {rightAction}
        </Card>
      </Flex>
    </div>
  );
};

export default PageNavbar;

const styles = {
  navbarCard: scoped({
    padding: `${theme.spacing.none} ${theme.spacing.lg}`,
    borderRadius: theme.radius.sm,
    minHeight: '36px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 0,
    flexDirection: 'row',
  }),
};
