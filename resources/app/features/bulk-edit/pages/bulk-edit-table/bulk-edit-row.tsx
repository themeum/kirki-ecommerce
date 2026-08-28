import { flexRender, type Row } from '@tanstack/react-table';
import { Fragment, memo } from 'react';

import { TableRow } from '@/components/ui/table';
import { ROW_HEIGHT } from '@/features/bulk-edit/lib/columns';
import type { ProductVariant } from '@/features/products';

type BulkEditRowProps = {
  row: Row<ProductVariant>;
};

const BulkEditRow = memo(({ row }: BulkEditRowProps) => (
  <TableRow style={{ height: ROW_HEIGHT }}>
    {row.getVisibleCells().map((cell) => (
      <Fragment key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</Fragment>
    ))}
  </TableRow>
));

BulkEditRow.displayName = 'BulkEditRow';

export default BulkEditRow;
