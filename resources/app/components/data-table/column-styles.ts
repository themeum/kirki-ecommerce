import type { Column, ColumnMeta } from '@tanstack/react-table';
import type { CSSProperties } from 'react';

import type { DataTableItem } from '@/components/data-table/types';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

/*
 * A pinned cell needs an opaque background of its own so the scrolled columns
 * pass underneath it — and it has to be opaque in the literal sense. `thead`
 * already paints `surfaceAlt`, which is 4% black, so reusing that token here
 * layers it a second time and renders the pinned column visibly darker than
 * the rest of the header. `solidSurfaceAlt` is the same colour pre-flattened
 * against the card.
 */
const stickyStyles = defineStyles({
  head: {
    position: 'sticky',
    zIndex: 2,
    backgroundColor: theme.colors.background.solidSurfaceAlt,
  },
  cell: {
    position: 'sticky',
    zIndex: 1,
    backgroundColor: theme.colors.background.fill,
  },
});

/*
 * Shrinks the column to its content (`whiteSpace: nowrap` on every cell keeps
 * that honest) instead of letting auto table layout hand it the row's slack.
 */
const actionsColumnMeta = {
  alignment: 'right',
  cssOverride: { width: '1%' },
} satisfies ColumnMeta<DataTableItem, unknown>;

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

export { actionsColumnMeta, getPinnedCss, getPinningStyle };
