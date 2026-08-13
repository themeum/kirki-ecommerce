import { type CSSObject } from '@emotion/react';

import { theme } from '@/theme';

const inventoryTableStyles: CSSObject = {
  '& tbody tr:hover': {
    backgroundColor: 'transparent',
  },
  '& tbody td:hover': {
    backgroundColor: theme.colors.background.surfaceSecondary,
  },
};

export { inventoryTableStyles };
