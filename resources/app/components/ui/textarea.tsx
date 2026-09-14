import { type CSSObject } from '@emotion/react';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge, uiFocusRing } from '@/theme/mixins';

type TextareaProps = Omit<ComponentPropsWithoutRef<'textarea'>, 'className' | 'css'> & {
  error?: boolean;
  cssOverride?: CSSObject;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const { cssOverride, error, rows = 5, value, ...rest } = props;

  return (
    <textarea
      ref={ref}
      rows={rows}
      data-error={error ? 'true' : undefined}
      css={scopedMerge(styles.base, cssOverride)}
      {...rest}
      {...('value' in props ? { value: value ?? '' } : {})}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;

const styles = defineStyles({
  base: {
    margin: 0,
    minHeight: '36px',
    width: '100%',
    backgroundColor: theme.colors.background.fill,
    border: `1px solid ${theme.colors.border.secondary}`,
    borderRadius: theme.radius.lg,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    resize: 'none',
    height: 'auto',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    cursor: 'text',
    '&::placeholder': {
      color: theme.colors.text.secondary,
      opacity: 0.8,
    },
    '&:focus-visible': {
      borderColor: theme.colors.background.fillBrand,
      ...uiFocusRing(theme),
    },
    '&[data-error="true"]': {
      border: `1px solid ${theme.colors.background.fillCritical}`,
      boxShadow: 'none',
      '&:focus-visible': {
        borderColor: theme.colors.background.fillCritical,
        ...uiFocusRing(theme, theme.colors.background.fillCriticalSecondary),
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
  },
});
