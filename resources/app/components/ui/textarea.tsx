import { type SerializedStyles, type Theme } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { theme } from '@/theme';
import { scoped, uiFocusRing } from '@/theme/mixins';

type TextareaProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'className' | 'css'
> & {
  error?: boolean;
  css?: SerializedStyles;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => {
    const { css: cssProp, error, rows = 5, value, ...rest } = props;

    return (
      <textarea
        ref={ref}
        rows={rows}
        data-error={error ? 'true' : undefined}
        css={[styles.base, cssProp]}
        {...rest}
        {...('value' in props ? { value: value ?? '' } : {})}
      />
    );
  },
);

Textarea.displayName = 'Textarea';

export default Textarea;

const styles = {
  base: scoped({
    margin: 0,
    minHeight: '36px',
    width: '100%',
    backgroundColor: theme.colors.background.fill,
    border: `1px solid ${theme.colors.border.default}`,
    boxShadow: theme.shadow.sm,
    borderRadius: theme.radius.lg,
    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    boxSizing: 'border-box',
    resize: 'none',
    height: 'auto',
    ...theme.typography.paragraph(),
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
  }),
};
