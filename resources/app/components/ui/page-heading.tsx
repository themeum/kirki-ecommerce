import {
  forwardRef,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ArrowLeft } from 'lucide-react';
import classNames from 'classnames';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Heading from '@/components/ui/heading';
import { CLASS_PREFIX } from '@/conf';
import type { ContainerSize, HeadingType } from '@/types';
import { __ } from '@/wpi18n';

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

const PageHeading = forwardRef<HTMLDivElement, PageHeadingProps>(
  (props, ref) => {
    const {
      type = '',
      text = __('Button', 'kirki-ecommerce'),
      hasBack = false,
      size,
      sticky,
      children,
      className,
      style = {},
      actions,
      leftIcon,
      noMargin,
      buttonProps = {},
    } = props;

    const {
      className: buttonClassName,
      children: buttonChildren,
      onClick: buttonOnClick,
      ...restButtonProps
    } = buttonProps;

    return (
      <div
        ref={ref}
        className={classNames(
          `${CLASS_PREFIX}-ui-heading-wrapper`,
          sticky && `${CLASS_PREFIX}-ui-heading-wrapper--sticky`,
          noMargin && `${CLASS_PREFIX}-ui-heading-wrapper--no-margin`,
        )}
      >
        <Container size={size} style={{ width: '100%' }}>
          <div
            className={classNames(
              `${CLASS_PREFIX}-ui-page-heading`,
              hasBack && `${CLASS_PREFIX}-ui-page-heading--has-back`,
              className,
            )}
            style={style}
          >
            {hasBack && (
              <Button
                variant="link"
                size="sm"
                className={buttonClassName}
                onClick={(event) => {
                  if (buttonOnClick) {
                    buttonOnClick(event);
                    return;
                  }
                  window.history.back();
                }}
                {...restButtonProps}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                {buttonChildren ?? __('Cancel', 'kirki-ecommerce')}
              </Button>
            )}
            {leftIcon && (
              <span
                className={`${CLASS_PREFIX}-ui-page-heading-icon`}
                aria-hidden="true"
              >
                {leftIcon}
              </span>
            )}
            <Heading type={type} text={text} />
            {children}
            <Flex
              className={`${CLASS_PREFIX}-ui-page-heading-actions`}
              gap={8}
            >
              {actions}
            </Flex>
          </div>
        </Container>
      </div>
    );
  },
);

PageHeading.displayName = 'PageHeading';

export default PageHeading;
