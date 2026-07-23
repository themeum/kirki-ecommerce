import { type SerializedStyles, type Theme } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { theme } from '@/theme';
import { fontGeneralSettings, scoped, uiFocusRing } from '@/theme/mixins';

type InputProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'className' | 'css'
> & {
  error?: boolean;
  invisible?: boolean;
  css?: SerializedStyles;
};

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    css: cssProp,
    error,
    invisible,
    type = 'text',
    value,
    ...rest
  } = props;

  return (
    <input
      ref={ref}
      type={type}
      data-error={error ? 'true' : undefined}
      css={[
        styles.base,
        invisible && styles.invisible,
        cssProp,
      ]}
      {...rest}
      {...('value' in props ? { value: value ?? '' } : {})}
    />
  );
});

Input.displayName = 'Input';

export default Input;

const styles = {
  base: scoped({
    margin: 0,
    minHeight: '36px',
    width: '100%',
    backgroundColor: theme.colors.background.fill,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
    padding: `${theme.spacing.xs} ${theme.spacing.lg}`,
    boxSizing: 'border-box',
    ...fontGeneralSettings(theme as Theme),
    cursor: 'text',
    '&::placeholder': {
      color: theme.colors.text.secondary,
      opacity: 0.8,
    },
    '&:focus-visible': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme as Theme),
    },
    '&[data-error="true"]': {
      border: `1px solid ${theme.colors.border.critical}`,
      boxShadow: 'none',
      '&:focus-visible': {
        borderColor: theme.colors.border.critical,
        ...uiFocusRing(theme as Theme, theme.colors.border.critical),
      },
    },
    '&:disabled': {
      backgroundColor: theme.colors.background.surfaceAlt,
      color: theme.colors.text.secondary,
      opacity: 0.8,
      borderColor: 'transparent',
      pointerEvents: 'none',
      '&::placeholder': {
        opacity: 0.5,
      },
    },
    '&[type="number"]': {
      MozAppearance: 'textfield',
      '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
        WebkitAppearance: 'none',
        margin: theme.spacing.none,
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
  invisible: scoped({
    backgroundColor: 'transparent',
    outline: 'none',
    borderColor: 'transparent',
    boxShadow: 'none',
    height: '100%',
    '&:focus-visible': {
      boxShadow: 'none',
      borderColor: 'transparent',
    },
  }),
};
