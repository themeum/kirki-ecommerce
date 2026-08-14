import type { CSSObject } from '@emotion/react';

import { theme } from '@/theme';

const pickerContentCss: CSSObject = {
  width: 'auto',
  minWidth: 'auto',
  maxWidth: 'none',
  padding: theme.spacing[2],
};

export { pickerContentCss };
