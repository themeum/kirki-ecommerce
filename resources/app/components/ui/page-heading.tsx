import { type SerializedStyles } from '@emotion/react';
import {
  forwardRef,
  type ComponentProps,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { ArrowLeft } from 'lucide-react';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Heading from '@/components/ui/heading';
import { theme } from '@/theme';
import { flexCenter, itemCenter, scoped } from '@/theme/mixins';
import type { ContainerSize, HeadingType } from '@/types';
import { __ } from '@/wpi18n';

type PageHeadingProps = {
  type?: HeadingType;
  text?: string;
  hasBack?: boolean;
  size?: ContainerSize;
  sticky?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
  actions?: ReactNode;
  leftIcon?: ReactNode;
  noMargin?: boolean;
  buttonProps?: Partial<ComponentProps<typeof Button>>;
  css?: SerializedStyles;
};

const PageHeading = forwardRef<HTMLDivElement, PageHeadingProps>(
  (props, ref) => {
    const {
      css: cssProp,
      type = '',
      text = __('Button', 'kirki-ecommerce'),
      hasBack = false,
      size,
      sticky,
      children,
      style = {},
      actions,
      leftIcon,
      noMargin,
      buttonProps = {},
    } = props;

    const {
      css: buttonCss,
      children: buttonChildren,
      onClick: buttonOnClick,
      ...restButtonProps
    } = buttonProps;

    return (
      <div
        ref={ref}
        css={[
          styles.wrapper,
          sticky && styles.wrapperSticky,
          noMargin && styles.wrapperNoMargin,
        ]}
      >
        <Container size={size} style={{ width: '100%' }}>
          <div
            css={[
              styles.heading,
              hasBack && styles.headingHasBack,
              cssProp,
            ]}
            style={style}
          >
            {hasBack && (
              <Button
                variant="link"
                size="sm"
                css={buttonCss}
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
              <span css={styles.icon} aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <Heading type={type} text={text} />
            {children}
            <Flex css={styles.actions} gap={8}>
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

const styles = {
  wrapper: scoped({
    marginBottom: theme.spacing['6xl'],
    marginTop: theme.spacing['6xl'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  }),
  wrapperSticky: scoped({
    top: '32px',
    left: 0,
    padding: `${theme.spacing['2xl']} ${theme.spacing.none}`,
    marginTop: theme.spacing.none,
    position: 'sticky',
    borderBottom: `1px solid ${theme.colors.border.default}`,
    backgroundColor: theme.colors.background.surfaceTertiary,
    zIndex: 100,
  }),
  wrapperNoMargin: scoped({
    marginTop: theme.spacing.none,
    marginBottom: theme.spacing.none,
  }),
  heading: scoped({
    width: '100%',
    ...itemCenter(),
    columnGap: theme.spacing.lg,
    paddingLeft: theme.spacing.sm,
  }),
  headingHasBack: scoped({
    paddingLeft: theme.spacing.none,
  }),
  icon: scoped({
    ...flexCenter(),
  }),
  actions: scoped({
    marginLeft: 'auto',
  }),
};
