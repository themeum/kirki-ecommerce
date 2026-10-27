import type { CSSObject } from '@emotion/react';

import { theme } from '@/theme';

const pickerContentCss: CSSObject = {
  width: 'auto',
  minWidth: 'auto',
  maxWidth: 'none',
  padding: theme.spacing[2],
};

const pickerPanelCss: CSSObject = {
  ...pickerContentCss,
  padding: 0,
};

export { pickerContentCss, pickerPanelCss };
