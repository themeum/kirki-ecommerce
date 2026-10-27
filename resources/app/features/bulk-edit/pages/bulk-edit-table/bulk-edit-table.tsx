import {
  type Column,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  useReactTable,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { forwardRef, useImperativeHandle, useRef } from 'react';

import { getPinnedCss, getPinningStyle } from '@/components/data-table/column-styles';
import type { DataTableItem } from '@/components/data-table/types';
import Flex from '@/components/ui/flex';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BulkEditOptionsProvider } from '@/features/bulk-edit/contexts/bulk-edit-options-context';
import {
  CellSelectionProvider,
  type FillCommitPayload,
} from '@/features/bulk-edit/contexts/cell-selection-context';
import { bulkEditColumns, ROW_HEIGHT, SKU_FIELD } from '@/features/bulk-edit/lib/columns';
import BulkEditRow from '@/features/bulk-edit/pages/bulk-edit-table/bulk-edit-row';
import SkuGenerateAction from '@/features/bulk-edit/pages/bulk-edit-table/sku-generate-action';
import type { ProductVariant } from '@/features/products';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type BulkEditTableProps = {
  variants: ProductVariant[];
  columnVisibility: VisibilityState;
  onColumnVisibilityChange: OnChangeFn<VisibilityState>;
  onFillCommit: (payload: FillCommitPayload) => void;
  onTypeToEdit: (field: string, rows: number[], char: string) => void;
  onSpaceToggle: (field: string, rows: number[]) => void;
  onGenerateSkus: (rows: number[]) => void;
  isGeneratingSkus: boolean;
};

type BulkEditTableHandle = {
  scrollToRow: (index: number) => void;
};

const BulkEditTable = forwardRef<BulkEditTableHandle, BulkEditTableProps>((props, ref) => {
  const {
    variants,
    columnVisibility,
    onColumnVisibilityChange,
    onFillCommit,
    onTypeToEdit,
    onSpaceToggle,
    onGenerateSkus,
    isGeneratingSkus,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data: variants,
    columns: bulkEditColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => String(row.id),
    state: { columnVisibility },
    onColumnVisibilityChange,
    initialState: { columnPinning: { left: ['variant'] } },
    enableColumnPinning: true,
  });

  const rows = table.getRowModel().rows;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    // Assumed size until the ResizeObserver reports the real one — avoids a
    // flash of zero rows on first paint, and (as a side effect) means jsdom,
    // which never fires ResizeObserver callbacks, still has enough rows to
    // interact with in tests.
    initialRect: { width: 1200, height: 640 },
  });

  useImperativeHandle(ref, () => ({
    scrollToRow: (index: number) => {
      virtualizer.scrollToIndex(index, { align: 'center' });
    },
  }));

  const virtualItems = virtualizer.getVirtualItems();
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <CellSelectionProvider
      containerRef={containerRef}
      onFillCommit={onFillCommit}
      onTypeToEdit={onTypeToEdit}
      onSpaceToggle={onSpaceToggle}
    >
      <BulkEditOptionsProvider>
        <div
          id="bulk-edit-scroll-container"
          ref={containerRef}
          css={scoped(styles.scrollContainer)}
        >
          <Table cssOverride={styles.table} fixed>
            <TableHeader cssOverride={styles.header}>
              <TableRow cssOverride={{ background: theme.colors.background.solidSurfaceAlt }}>
                {table.getHeaderGroups()[0]?.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    cssOverride={getPinnedCss(
                      header.column as unknown as Column<DataTableItem, unknown>,
                      true,
                    )}
                    style={{
                      width: header.getSize(),
                      ...getPinningStyle(
                        header.column as unknown as Column<DataTableItem, unknown>,
                      ),
                      borderBottom: `1px solid ${theme.colors.border.default}`,
                      borderRight: `1px solid ${theme.colors.border.default}`,
                    }}
                    alignment={header.column.columnDef.meta?.alignment}
                    data-sticky-cell={header.column.getIsPinned() ? 'true' : undefined}
                  >
                    {header.column.id === SKU_FIELD ? (
                      <Flex align="center" cssOverride={styles.skuHeader}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <SkuGenerateAction onGenerate={onGenerateSkus} loading={isGeneratingSkus} />
                      </Flex>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paddingTop > 0 && (
                <tr aria-hidden="true">
                  <td
                    style={{ height: paddingTop, padding: 0, border: 'none' }}
                    colSpan={table.getVisibleFlatColumns().length}
                  />
                </tr>
              )}
              {virtualItems.map((virtualRow) => (
                <BulkEditRow key={rows[virtualRow.index]?.id} row={rows[virtualRow.index]} />
              ))}
              {paddingBottom > 0 && (
                <tr aria-hidden="true">
                  <td
                    style={{ height: paddingBottom, padding: 0, border: 'none' }}
                    colSpan={table.getVisibleFlatColumns().length}
                  />
                </tr>
              )}
            </TableBody>
          </Table>
        </div>
      </BulkEditOptionsProvider>
    </CellSelectionProvider>
  );
});

BulkEditTable.displayName = 'BulkEditTable';

export default BulkEditTable;
export type { BulkEditTableHandle };

const styles = defineStyles({
  skuHeader: {
    position: 'relative',
  },
  scrollContainer: {
    maxHeight: 'calc(100svh - 0px)',

    overflow: 'auto',
    isolation: 'isolate',
    borderCollapse: 'separate',
    paddingBottom: theme.spacing[4],
    '& [data-slot="table-container"]': {
      overflow: 'visible',
    },
  },
  table: {
    borderCollapse: 'separate',
    borderSpacing: 0,
    paddingRight: theme.spacing[8],
    '& td': {
      padding: `0 ${theme.spacing[1]}`,
    },
  },
  header: {
    position: 'sticky',
    top: 0,
    zIndex: theme.zIndex.sticky,
  },
});
