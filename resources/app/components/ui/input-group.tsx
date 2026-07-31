import { type CSSObject, type Theme } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent } from 'react';

import Button from '@/components/ui/button';
import { theme } from '@/theme';
import { flexCenter, itemCenter, uiFocusRing, scopedMerge, mergeCss, defineStyles } from '@/theme/mixins';

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
  cssOverride?: CSSObject;
};

type InputGroupAddonProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  align?: InputGroupAlign;
  cssOverride?: CSSObject;
};

type InputGroupInputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

type InputGroupTextareaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

type InputGroupTextProps = Omit<
  ComponentPropsWithoutRef<'span'>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
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
    cssOverride,
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
      css={scopedMerge(styles.group, cssOverride)}
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
      cssOverride,
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
        css={scopedMerge(styles.addon, styles.addonAlign[align], cssOverride)}
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
    const { cssOverride, type = 'text', value, ...rest } = props;

    return (
      <input
        ref={ref}
        type={type}
        data-slot="input-group-control"
        css={scopedMerge(styles.control, styles.input, cssOverride)}
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
  const { cssOverride, rows = 5, value, ...rest } = props;

  return (
    <textarea
      ref={ref}
      rows={rows}
      data-slot="input-group-control"
      css={scopedMerge(styles.control, styles.textarea, cssOverride)}
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
    const { cssOverride, ...rest } = props;

    return <span ref={ref} css={scopedMerge(styles.text, cssOverride)} {...rest} />;
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
      cssOverride,
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
        cssOverride={mergeCss(styles.button, styles.buttonSizes[size], cssOverride)}
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

const styles = defineStyles({
  group: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    minWidth: 0,
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
  },
  addon: {
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
  },
  addonAlign: {
    'inline-start': {
      order: -1,
      paddingLeft: theme.spacing[3],
      pointerEvents: 'none',
      '& > button': {
        pointerEvents: 'auto',
      },
    },
    'inline-end': {
      order: 1,
      paddingRight: theme.spacing[1],
      borderLeft: `1px solid ${theme.colors.border.default}`,
      alignSelf: 'stretch',
      '& > button': {
        pointerEvents: 'auto',
      },
    },
    'block-start': {
      order: -1,
      width: '100%',
      justifyContent: 'flex-start',
      padding: `${theme.spacing[3]} ${theme.spacing[3]} 0`,
    },
    'block-end': {
      order: 1,
      width: '100%',
      justifyContent: 'flex-start',
      padding: `0 ${theme.spacing[3]} ${theme.spacing[3]}`,
    },
  },
  control: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    margin: 0,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    boxShadow: 'none',
    boxSizing: 'border-box',
    ...theme.typography.paragraph(),
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
  },
  input: {
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
  },
  textarea: {
    minHeight: '36px',
    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    resize: 'none',
    height: 'auto',
  },
  text: {
    ...itemCenter(),
    gap: theme.spacing[2],
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
    '& svg': {
      pointerEvents: 'none',
    },
  },
  button: {
    boxShadow: 'none',
  },
  buttonSizes: {
    xs: {
      ...theme.typography.small(),
      height: '24px',
      gap: theme.spacing[1],
      borderRadius: theme.radius.md,
      padding: `0 ${theme.spacing[2]}`,
    },
    sm: {
      height: '32px',
      gap: theme.spacing[2],
      borderRadius: theme.radius.md,
      padding: `0 ${theme.spacing[2]}`,
    },
    'icon-xs': {
      ...flexCenter(),
      width: '24px',
      height: '24px',
      padding: 0,
      borderRadius: theme.radius.md,
    },
    'icon-sm': {
      ...flexCenter(),
      width: '32px',
      height: '32px',
      padding: 0,
    },
  },
});
