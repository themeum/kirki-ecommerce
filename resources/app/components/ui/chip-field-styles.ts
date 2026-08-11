import type { CSSObject } from '@emotion/react';

import { theme } from '@/theme';

/**
 * Styles for the input placed in ChipField's `control` slot, so it reads as
 * part of the box rather than as a nested input.
 */
const chipFieldControlCss: CSSObject = {
  width: '100%',
  minHeight: '36px',
  margin: 0,
  padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  border: 'none',
  borderRadius: theme.radius.none,
  backgroundColor: 'transparent',
  outline: 'none',
  boxShadow: 'none',
  cursor: 'text',
  ...theme.typography.small(),
  color: theme.colors.text.primary,
  '&::placeholder': {
    color: theme.colors.text.secondary,
    opacity: 0.8,
  },
  '&:disabled': {
    cursor: 'not-allowed',
    color: theme.colors.text.secondary,
  },
  '&:focus, &:focus-visible': {
    outline: 'none',
    boxShadow: 'none',
    borderColor: 'transparent',
  },
};

export { chipFieldControlCss };
