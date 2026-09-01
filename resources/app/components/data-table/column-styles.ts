import type { Column } from '@tanstack/react-table';
import type { CSSProperties } from 'react';

import type { DataTableItem } from '@/components/data-table/types';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

const stickyStyles = defineStyles({
  head: {
    position: 'sticky',
    zIndex: 2,
    backgroundColor: theme.colors.background.surfaceAlt,
    borderBottom: `1px solid ${theme.colors.border.default}`,
  },
  cell: {
    position: 'sticky',
    zIndex: 1,
    backgroundColor: theme.colors.background.fill,
  },
});

const getPinningStyle = <T extends DataTableItem>(column: Column<T>): CSSProperties | undefined => {
  const pinned = column.getIsPinned();

  if (!pinned) {
    return undefined;
  }

  return {
    left: pinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: pinned === 'right' ? `${column.getAfter('right')}px` : undefined,
  };
};

const getPinnedCss = <T extends DataTableItem>(column: Column<T>, isHeader: boolean) => {
  if (!column.getIsPinned()) {
    return undefined;
  }

  return isHeader ? stickyStyles.head : stickyStyles.cell;
};

export { getPinnedCss, getPinningStyle };
