import { type CSSObject } from '@emotion/react';
import { ArrowLeft } from 'lucide-react';
import { forwardRef, type ComponentProps, type CSSProperties, type ReactNode } from 'react';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { flexCenter, itemCenter, scopedMerge, scoped, defineStyles } from '@/theme/mixins';
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
  cssOverride?: CSSObject;
};

const PageHeading = forwardRef<HTMLDivElement, PageHeadingProps>(
  (props, ref) => {
    const {
      cssOverride,
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
      cssOverride: buttonCssOverride,
      children: buttonChildren,
      onClick: buttonOnClick,
      ...restButtonProps
    } = buttonProps;

    return (
      <div
        ref={ref}
        css={scopedMerge(styles.wrapper,           sticky && styles.wrapperSticky,           noMargin && styles.wrapperNoMargin)}
      >
        <Container size={size} style={{ width: '100%' }}>
          <div
            css={scopedMerge(styles.heading,               hasBack && styles.headingHasBack,               cssOverride)}
            style={style}
          >
            {hasBack && (
              <Button
                variant="link"
                cssOverride={buttonCssOverride}
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
                {buttonChildren}
              </Button>
            )}
            {leftIcon && (
              <span css={scoped(styles.icon)} aria-hidden="true">
                {leftIcon}
              </span>
            )}
            <Text variant='heading5'>{text}</Text>

            {children}
            <Flex cssOverride={styles.actions} gap={2}>
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

const styles = defineStyles({
  wrapper: {
    marginBottom: theme.spacing[8],
    marginTop: theme.spacing[8],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wrapperSticky: {
    top: '32px',
    left: 0,
    padding: `${theme.spacing[4]} ${theme.spacing[0]}`,
    marginTop: theme.spacing[0],
    position: 'sticky',
    borderBottom: `1px solid ${theme.colors.border.default}`,
    backgroundColor: theme.colors.background.surfaceTertiary,
    zIndex: 100,
  },
  wrapperNoMargin: {
    marginTop: theme.spacing[0],
    marginBottom: theme.spacing[0],
  },
  heading: {
    width: '100%',
    ...itemCenter(),
    columnGap: theme.spacing[3],
    paddingLeft: theme.spacing[2],
  },
  headingHasBack: {
    paddingLeft: theme.spacing[0],
  },
  icon: {
    ...flexCenter(),
  },
  actions: {
    marginLeft: 'auto',
  },
});
