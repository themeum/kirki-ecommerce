import type { ReactNode, CSSProperties, ComponentProps } from 'react';
import classNames from 'classnames';

import Heading from '@/molecules/heading';
import { CLASS_PREFIX } from '@/conf';
import Button from '@/molecules/button';
import { ArrowLeftIcon } from '@/icons';
import Flex from '@/molecules/flex';
import Container from '@/molecules/container';
import { __ } from '@/wpi18n';
import type { HeadingType, ContainerSize } from '@/types';

type PageHeadingProps = {
  type?: HeadingType;
  text?: string;
  hasBack?: boolean;
  size?: ContainerSize;
  sticky?: boolean;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  actions?: ReactNode;
  leftIcon?: ReactNode;
  noMargin?: boolean;
  buttonProps?: Partial<ComponentProps<typeof Button>>;
};

const PageHeading = ({
  type = '',
  text = __('Button', 'kirki-ecommerce'),
  hasBack = false,
  size,
  sticky,
  children,
  className = '',
  style = {},
  actions,
  leftIcon,
  noMargin,
  buttonProps = {},
}: PageHeadingProps) => {
  const allClassNames = classNames(
    `${CLASS_PREFIX}-page-heading`,
    hasBack && `${CLASS_PREFIX}-has-back`,
    className,
  );

  return (
    <div
      className={`${CLASS_PREFIX}-heading-wrapper ${
        sticky ? `${CLASS_PREFIX}-sticky-heading` : ''
      } ${noMargin ? `${CLASS_PREFIX}-no-margin` : ''}`}
    >
      <Container size={size} style={{ width: '100%' }}>
        <span className={`${allClassNames}`} style={style}>
          {hasBack && (
            <Button
              text={__('Cancel', 'kirki-ecommerce')}
              type="link"
              size="small"
              {...buttonProps}
              icon={<ArrowLeftIcon />}
              onClick={() => window.history.back()}
              style={{ marginRight: '4px' }}
            />
          )}
          {leftIcon && (
            <span className={`${CLASS_PREFIX}-svg-class`}>{leftIcon}</span>
          )}
          <Heading type={type} text={text} />
          {children}
          <Flex
            className={`${CLASS_PREFIX}-page-heading-action-buttons`}
            gap={8}
          >
            {actions}
          </Flex>
        </span>
      </Container>
    </div>
  );
};

export default PageHeading;
