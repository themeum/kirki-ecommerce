import { css, type SerializedStyles, type Theme } from '@emotion/react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type MouseEvent,
} from 'react';

import Button from '@/components/ui/button';
import { theme } from '@/theme';
import {
  flexCenter,
  fontGeneralSettings,
  itemCenter,
  scoped,
  uiFocusRing,
} from '@/theme/mixins';

type InputGroupAlign =
  | 'inline-start'
  | 'inline-end'
  | 'block-start'
  | 'block-end';

type InputGroupButtonSize = 'xs' | 'sm' | 'icon-xs' | 'icon-sm';

type InputGroupProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  error?: boolean;
  disabled?: boolean;
  css?: SerializedStyles;
};

type InputGroupAddonProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  align?: InputGroupAlign;
  css?: SerializedStyles;
};

type InputGroupInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

type InputGroupTextareaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

type InputGroupTextProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

type InputGroupButtonProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  'size' | 'className'
> & {
  size?: InputGroupButtonSize;
};

/**
 * Flex container that owns border, focus ring, and error/disabled states for grouped inputs.
 *
 * @param props Component props.
 *
 * @returns Input group wrapper element.
 * @since 1.0.0
 */
const InputGroup = forwardRef<HTMLDivElement, InputGroupProps>((props, ref) => {
  const {
    css: cssProp,
    error,
    disabled,
    children,
    ...rest
  } = props;

  return (
    <div
      ref={ref}
      role="group"
      data-slot="input-group"
      data-error={error ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      css={[styles.group, cssProp]}
      {...rest}
    >
      {children}
    </div>
  );
});

InputGroup.displayName = 'InputGroup';

/**
 * Addon slot for icons, text, or buttons positioned relative to the control.
 *
 * @param props Component props.
 *
 * @returns Addon element.
 * @since 1.0.0
 */
const InputGroupAddon = forwardRef<HTMLDivElement, InputGroupAddonProps>(
  (props, ref) => {
    const {
      css: cssProp,
      align = 'inline-start',
      children,
      onClick,
      ...rest
    } = props;

    const handleClick = (event: MouseEvent<HTMLDivElement>) => {
      onClick?.(event);

      if (event.defaultPrevented) {
        return;
      }

      if ((event.target as HTMLElement).closest('button')) {
        return;
      }

      const group = event.currentTarget.parentElement;
      const control = group?.querySelector(
        '[data-slot="input-group-control"]',
      ) as HTMLElement | null;
      control?.focus();
    };

    return (
      <div
        ref={ref}
        role="group"
        data-slot="input-group-addon"
        data-align={align}
        css={[styles.addon, styles.addonAlign[align], cssProp]}
        onClick={handleClick}
        {...rest}
      >
        {children}
      </div>
    );
  },
);

InputGroupAddon.displayName = 'InputGroupAddon';

/**
 * Borderless input control for use inside InputGroup.
 *
 * @param props Component props.
 *
 * @returns Input element.
 * @since 1.0.0
 */
const InputGroupInput = forwardRef<HTMLInputElement, InputGroupInputProps>(
  (props, ref) => {
    const { css: cssProp, type = 'text', value, ...rest } = props;

    return (
      <input
        ref={ref}
        type={type}
        data-slot="input-group-control"
        css={[styles.control, styles.input, cssProp]}
        {...rest}
        {...('value' in props ? { value: value ?? '' } : {})}
      />
    );
  },
);

InputGroupInput.displayName = 'InputGroupInput';

/**
 * Borderless textarea control for use inside InputGroup.
 *
 * @param props Component props.
 *
 * @returns Textarea element.
 * @since 1.0.0
 */
const InputGroupTextarea = forwardRef<
  HTMLTextAreaElement,
  InputGroupTextareaProps
>((props, ref) => {
  const { css: cssProp, rows = 5, value, ...rest } = props;

  return (
    <textarea
      ref={ref}
      rows={rows}
      data-slot="input-group-control"
      css={[styles.control, styles.textarea, cssProp]}
      {...rest}
      {...('value' in props ? { value: value ?? '' } : {})}
    />
  );
});

InputGroupTextarea.displayName = 'InputGroupTextarea';

/**
 * Muted inline text for use inside InputGroupAddon.
 *
 * @param props Component props.
 *
 * @returns Text span element.
 * @since 1.0.0
 */
const InputGroupText = forwardRef<HTMLSpanElement, InputGroupTextProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return <span ref={ref} css={[styles.text, cssProp]} {...rest} />;
  },
);

InputGroupText.displayName = 'InputGroupText';

/**
 * Compact button for use inside InputGroupAddon.
 *
 * @param props Component props.
 *
 * @returns Button element.
 * @since 1.0.0
 */
const InputGroupButton = forwardRef<HTMLButtonElement, InputGroupButtonProps>(
  (props, ref) => {
    const {
      css: cssProp,
      variant = 'ghost',
      size = 'xs',
      type = 'button',
      ...rest
    } = props;

    return (
      <Button
        ref={ref}
        type={type}
        variant={variant}
        css={css(styles.button, styles.buttonSizes[size], cssProp)}
        {...rest}
      />
    );
  },
);

InputGroupButton.displayName = 'InputGroupButton';

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
};

export type {
  InputGroupAlign,
  InputGroupButtonSize,
  InputGroupProps,
  InputGroupAddonProps,
  InputGroupInputProps,
  InputGroupTextareaProps,
  InputGroupTextProps,
  InputGroupButtonProps,
};

const styles = {
  group: scoped({
    position: 'relative',
    display: 'flex',
    width: '100%',
    minHeight: '36px',
    alignItems: 'center',
    borderRadius: theme.radius.lg,
    border: `1px solid ${theme.colors.border.default}`,
    backgroundColor: theme.colors.background.fill,
    boxSizing: 'border-box',
    transition: 'color, box-shadow',
    overflow: 'hidden',
    '&:focus-within': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme as Theme),
    },
    '&[data-error="true"]': {
      border: `1px solid ${theme.colors.border.critical}`,
      boxShadow: 'none',
      '&:focus-within': {
        borderColor: theme.colors.border.critical,
        ...uiFocusRing(theme as Theme, theme.colors.border.critical),
      },
    },
    '&[data-disabled="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      opacity: 0.8,
      borderColor: 'transparent',
      pointerEvents: 'none',
    },
    '&:has([data-align="block-start"]), &:has([data-align="block-end"])': {
      flexDirection: 'column',
      alignItems: 'stretch',
      height: 'auto',
    },
  }),
  addon: scoped({
    ...itemCenter(),
    justifyContent: 'center',
    gap: theme.spacing[2],
    height: 'auto',
    color: theme.colors.text.secondary,
    cursor: 'text',
    userSelect: 'none',
    flexShrink: 0,
    '& svg': {
      flexShrink: 0,
    },
  }),
  addonAlign: {
    'inline-start': scoped({
      order: -1,
      paddingLeft: theme.spacing[3],
      pointerEvents: 'none',
      '& > button': {
        pointerEvents: 'auto',
      },
    }),
    'inline-end': scoped({
      order: 1,
      paddingRight: theme.spacing[3],
      '& > button': {
        pointerEvents: 'auto',
      },
    }),
    'block-start': scoped({
      order: -1,
      width: '100%',
      justifyContent: 'flex-start',
      padding: `${theme.spacing[3]} ${theme.spacing[3]} 0`,
    }),
    'block-end': scoped({
      order: 1,
      width: '100%',
      justifyContent: 'flex-start',
      padding: `0 ${theme.spacing[3]} ${theme.spacing[3]}`,
    }),
  },
  control: scoped({
    flex: 1,
    width: '100%',
    minWidth: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    boxShadow: 'none',
    boxSizing: 'border-box',
    ...fontGeneralSettings(theme as Theme),
    cursor: 'text',
    '&::placeholder': {
      color: theme.colors.text.secondary,
      opacity: 0.8,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: 'none',
      borderColor: 'transparent',
    },
    '&:disabled': {
      color: theme.colors.text.secondary,
      opacity: 0.8,
      pointerEvents: 'none',
      '&::placeholder': {
        opacity: 0.5,
      },
    },
  }),
  input: scoped({
    minHeight: '36px',
    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    '&[type="number"]': {
      MozAppearance: 'textfield',
      '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
        WebkitAppearance: 'none',
        margin: theme.spacing[0],
      },
    },
    '&[type="search"]': {
      WebkitAppearance: 'none',
      appearance: 'none',
      '&::-webkit-search-cancel-button, &::-webkit-search-decoration, &::-webkit-search-results-button, &::-webkit-search-results-decoration':
        {
          display: 'none',
          WebkitAppearance: 'none',
        },
    },
  }),
  textarea: scoped({
    minHeight: '36px',
    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    resize: 'none',
    height: 'auto',
  }),
  text: scoped({
    ...itemCenter(),
    gap: theme.spacing[2],
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: theme.typography.lineHeight.tight,
    whiteSpace: 'nowrap',
    '& svg': {
      pointerEvents: 'none',
    },
  }),
  button: scoped({
    boxShadow: 'none',
  }),
  buttonSizes: {
    xs: scoped({
      height: '24px',
      gap: theme.spacing[1],
      borderRadius: theme.radius.md,
      padding: `0 ${theme.spacing[2]}`,
      fontSize: theme.typography.fontSize.xs,
      lineHeight: theme.typography.lineHeight.tight,
    }),
    sm: scoped({
      height: '32px',
      gap: theme.spacing[2],
      borderRadius: theme.radius.md,
      padding: `0 ${theme.spacing[2]}`,
    }),
    'icon-xs': scoped({
      ...flexCenter(),
      width: '24px',
      height: '24px',
      padding: 0,
      borderRadius: theme.radius.md,
    }),
    'icon-sm': scoped({
      ...flexCenter(),
      width: '32px',
      height: '32px',
      padding: 0,
    }),
  },
};
