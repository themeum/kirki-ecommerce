import type { CSSProperties, ReactNode } from 'react';

import Button from '@/components/ui/button';
import { CLASS_PREFIX } from '@/conf';
import { ArrowLeftIcon } from '@/icons';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
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
      <Flex style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Button
          size="sm"
          variant="ghost"
          aria-label={__('Back', 'kirki-ecommerce')}
          onClick={handleBack ?? (() => window.history.back())}
          className={`${CLASS_PREFIX}-page-navbar-back-button`}
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
        <Card type="navbar">
          <Text type="primary" header={text} leftIcon={textIcon} />
          {rightAction}
        </Card>
      </Flex>
    </div>
  );
};

export default PageNavbar;
