import type { CSSObject } from '@emotion/react';

import { theme } from '@/theme';

/**
 * Styles for the popover surface shared by the date, range, and date-time
 * pickers, so the calendar sizes itself instead of the popover's defaults.
 */
const pickerContentCss: CSSObject = {
  width: 'auto',
  minWidth: 'auto',
  maxWidth: 'none',
  padding: theme.spacing[2],
};

export { pickerContentCss };
