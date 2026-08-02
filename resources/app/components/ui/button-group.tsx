import type { CSSObject } from '@emotion/react';
import { Slot } from '@radix-ui/react-slot';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';

import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import { itemCenter, mergeCss, scopedMerge, defineStyles } from '@/theme/mixins';

type ButtonGroupOrientation = 'horizontal' | 'vertical';

type ButtonGroupProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  orientation?: ButtonGroupOrientation;
  cssOverride?: CSSObject;
};

type ButtonGroupTextProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  asChild?: boolean;
  cssOverride?: CSSObject;
};

type ButtonGroupSeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof Separator>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const mergeChild = (pseudo: string) => {
  return [
    `& > button${pseudo}`,
    `& > input${pseudo}`,
    `& > [data-slot="button-group-text"]${pseudo}`,
    `& > [data-slot="select-trigger"]${pseudo}`,
  ].join(', ');
};

/**
 * Container that groups related buttons and controls with merged borders.
 *
 * @param props Component props.
 *
 * @returns Button group wrapper element.
 * @since 1.0.0
 */
const ButtonGroup = forwardRef<HTMLDivElement, ButtonGroupProps>(
  (props, ref) => {
    const {
      cssOverride,
      orientation = 'horizontal',
      children,
      ...rest
    } = props;

    return (
      <div
        ref={ref}
        role="group"
        data-slot="button-group"
        data-orientation={orientation}
        css={scopedMerge(
          styles.group,
          orientation === 'vertical' ? styles.vertical : styles.horizontal,
          cssOverride,
        )}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

ButtonGroup.displayName = 'ButtonGroup';

/**
 * Prefix or suffix text slot for use inside ButtonGroup.
 *
 * @param props Component props.
 *
 * @returns Text element or Slot-merged custom element.
 * @since 1.0.0
 */
const ButtonGroupText = forwardRef<HTMLDivElement, ButtonGroupTextProps>(
  (props, ref) => {
    const {
      cssOverride,
      asChild = false,
      ...rest
    } = props;

    const Comp = asChild ? Slot : 'div';

    return (
      <Comp
        ref={ref}
        data-slot="button-group-text"
        css={scopedMerge(styles.text, cssOverride)}
        {...rest}
      />
    );
  },
);

ButtonGroupText.displayName = 'ButtonGroupText';

/**
 * Visual divider between segments within a ButtonGroup.
 *
 * @param props Component props.
 *
 * @returns Separator element.
 * @since 1.0.0
 */
const ButtonGroupSeparator = forwardRef<
  ElementRef<typeof Separator>,
  ButtonGroupSeparatorProps
>((props, ref) => {
  const {
    cssOverride,
    orientation = 'vertical',
    ...rest
  } = props;

  return (
    <Separator
      ref={ref}
      data-slot="button-group-separator"
      orientation={orientation}
      cssOverride={mergeCss(styles.separator, cssOverride)}
      {...rest}
    />
  );
});

ButtonGroupSeparator.displayName = 'ButtonGroupSeparator';

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
};

export type {
  ButtonGroupOrientation,
  ButtonGroupProps,
  ButtonGroupSeparatorProps,
  ButtonGroupTextProps,
};

const styles = defineStyles({
  group: {
    display: 'flex',
    width: 'max-content',
    alignItems: 'stretch',
    '&:has(> [data-slot="button-group"])': {
      gap: theme.spacing[2],
    },
    '& > *:focus-visible': {
      position: 'relative',
      zIndex: 1,
    },
    '& > input': {
      flex: 1,
    },
    '& > [data-slot="select-trigger"]': {
      width: 'fit-content',
    },
  },
  horizontal: {
    flexDirection: 'row',
    [mergeChild(':not(:first-child)')]: {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0,
      marginLeft: '-1px',
    },
    [mergeChild(':not(:last-child)')]: {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0,
    },
  },
  vertical: {
    flexDirection: 'column',
    [mergeChild(':not(:first-child)')]: {
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      marginTop: '-1px',
    },
    [mergeChild(':not(:last-child)')]: {
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
    },
  },
  text: {
    ...itemCenter(),
    gap: theme.spacing[2],
    backgroundColor: theme.colors.background.surfaceAlt,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    padding: `0 ${theme.spacing[3]}`,
    ...theme.typography.small('medium'),
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    '& svg': {
      flexShrink: 0,
      pointerEvents: 'none',
      width: '16px',
      height: '16px',
    },
  },
  separator: {
    margin: 0,
    marginTop: 0,
    marginBottom: 0,
    alignSelf: 'stretch',
    '&[data-orientation="vertical"]': {
      height: 'auto',
    },
  },
});
