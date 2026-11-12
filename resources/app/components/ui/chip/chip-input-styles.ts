import type { CSSObject } from '@emotion/react';

import { theme } from '@/theme';

/**
 * Styles for the control placed in ChipsInput's `control` slot, so it reads as
 * part of the box rather than as a nested input.
 *
 * The box sets the height, so the control is left at its own line height and
 * capped only so a chip beside it stays the tallest thing on the row.
 */
const chipsInputControlCss: CSSObject = {
  width: '100%',
  minHeight: 0,
  maxHeight: '24px',
  margin: 0,
  padding: `0 ${theme.spacing[1]}`,
  border: 'none',
  borderRadius: theme.radius.none,
  backgroundColor: 'transparent',
  outline: 'none',
  boxShadow: 'none',
  cursor: 'text',
  ...theme.typography.small('medium'),
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

export { chipsInputControlCss };
