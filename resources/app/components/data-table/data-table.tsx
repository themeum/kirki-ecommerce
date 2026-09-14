import type { CSSObject } from '@emotion/react';
import type {
  ColumnDef,
  ColumnPinningState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortDirection,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPinnedCss, getPinningStyle } from '@/components/data-table/column-styles';
import DataTableColumnVisibility from '@/components/data-table/data-table-column-visibility';
import DataTableEmptyState from '@/components/data-table/data-table-empty-state';
import DataTableSelectionBar from '@/components/data-table/data-table-selection-bar';
import DataTableSkeleton from '@/components/data-table/data-table-skeleton';
import type {
  DataTableBulkAction,
  DataTableItem,
  DataTableSelectionState,
} from '@/components/data-table/types';
import useTableColumnVisibility from '@/components/data-table/use-table-column-visibility';
import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import Flex from '@/components/ui/flex';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSelect,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowDownFilled, ArrowDownUpFilled, ArrowUpFilled } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { TableDensity } from '@/types/components/common';
import { ELLIPSIS, getPageItems } from '@/utils/pagination';

type DataTableProps<T extends DataTableItem> = {
  tableId: string;
  data: T[];
  columns: ColumnDef<T>[];
  pageCount: number;
  total?: number;
  pagination: PaginationState;
  onPaginationChange: OnChangeFn<PaginationState>;
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  isLoading?: boolean;
  emptyState?: ReactNode;
  toolbar?: ReactNode;
  onRowClick?: (item: T) => void;
  density?: TableDensity;
  fixed?: boolean;
  cssOverride?: CSSObject;
  hidePagination?: boolean;
  enableRowSelection?: boolean;
  selectionResetKey?: string | number;
  onRowSelectionChange?: (state: DataTableSelectionState) => void;
  bulkActions?: DataTableBulkAction[];
  onBulkApply?: (action: string, selection: DataTableSelectionState) => void | Promise<void>;
  columnPinning?: ColumnPinningState;
  columnVisibility?: VisibilityState;
  enableColumnVisibility?: boolean;
};

const EMPTY_COLUMN_PINNING: ColumnPinningState = {};

const noop = () => undefined;

const renderSortIndicator = (direction: SortDirection | false) => {
  if (direction === 'asc') {
    return <ArrowUpFilled color={theme.colors.icon.secondary} />;
  }

  if (direction === 'desc') {
    return <ArrowDownFilled color={theme.colors.icon.secondary} />;
  }

  return (
    <ArrowDownUpFilled top={theme.colors.icon.secondary} bottom={theme.colors.icon.secondary} />
  );
};

const DataTable = <T extends DataTableItem>(props: DataTableProps<T>) => {
  const {
    tableId,
    data,
    columns,
    pageCount,
    total = data.length,
    pagination,
    onPaginationChange,
    sorting,
    onSortingChange,
    isLoading = false,
    emptyState,
    toolbar,
    onRowClick,
    density,
    fixed,
    cssOverride,
    hidePagination = false,
    enableRowSelection = false,
    selectionResetKey,
    onRowSelectionChange,
    bulkActions,
    onBulkApply,
    columnPinning = EMPTY_COLUMN_PINNING,
    columnVisibility,
    enableColumnVisibility = true,
  } = props;

  const [storedColumnVisibility, toggleColumnVisibility] = useTableColumnVisibility(tableId);
  const isColumnVisibilityControlled = columnVisibility !== undefined;
  const resolvedColumnVisibility = isColumnVisibilityControlled
    ? columnVisibility
    : storedColumnVisibility;
  const showColumnVisibilityMenu = enableColumnVisibility && !isColumnVisibilityControlled;

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false);

  const handleTanStackRowSelectionChange: OnChangeFn<RowSelectionState> = useCallback((updater) => {
    setIsAllMatchingSelected(false);
    setRowSelection((old) => (typeof updater === 'function' ? updater(old) : updater));
  }, []);

  const handleSelectAllMatching = useCallback(() => {
    setIsAllMatchingSelected(true);
    setRowSelection({});
  }, []);

  const handleClearSelection = useCallback(() => {
    setIsAllMatchingSelected(false);
    setRowSelection({});
  }, []);

  useEffect(() => {
    setIsAllMatchingSelected(false);
    setRowSelection({});
  }, [selectionResetKey]);

  const resolvedColumns = useMemo<ColumnDef<T>[]>(() => {
    if (!enableRowSelection) {
      return columns;
    }

    const selectColumn: ColumnDef<T> = {
      id: 'select',
      size: 40,
      enableSorting: false,
      header: ({ table }) => (
        <Checkbox
          value={isAllMatchingSelected || table.getIsAllPageRowsSelected()}
          isPartialChecked={!isAllMatchingSelected && table.getIsSomePageRowsSelected()}
          onChange={(value) => table.toggleAllPageRowsSelected(value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          value={isAllMatchingSelected || row.getIsSelected()}
          onChange={(value) => row.toggleSelected(value)}
        />
      ),
    };

    return [selectColumn, ...columns];
  }, [columns, enableRowSelection, isAllMatchingSelected]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    pageCount,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    enableSortingRemoval: true,
    sortDescFirst: false,
    enableRowSelection,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination,
      sorting,
      rowSelection,
      columnPinning,
      columnVisibility: resolvedColumnVisibility,
    },
    onPaginationChange,
    onSortingChange,
    onRowSelectionChange: handleTanStackRowSelectionChange,
    onColumnPinningChange: noop,
    onColumnVisibilityChange: noop,
  });

  const selectedIds = useMemo(
    () => Object.keys(rowSelection).filter((id) => rowSelection[id]),
    [rowSelection],
  );

  const selection = useMemo<DataTableSelectionState>(
    () => ({
      selectedIds,
      isAllMatchingSelected,
      selectedCount: isAllMatchingSelected ? total : selectedIds.length,
    }),
    [selectedIds, isAllMatchingSelected, total],
  );

  useEffect(() => {
    onRowSelectionChange?.(selection);
  }, [selection, onRowSelectionChange]);

  const rows = table.getRowModel().rows;
  const visibleColumnCount = table.getVisibleLeafColumns().length;
  const skeletonRowCount = data.length || pagination.pageSize;

  const tableRef = useRef<HTMLTableElement>(null);
  const measuredHeights = useRef<{ row?: number }>({});
  const measuredColumnWidths = useRef<Record<string, number>>({});

  useEffect(() => {
    if (isLoading || rows.length === 0) {
      return;
    }

    const rowHeight = tableRef.current?.querySelector('tbody tr')?.getBoundingClientRect().height;
    if (rowHeight) {
      measuredHeights.current.row = rowHeight;
    }

    tableRef.current?.querySelectorAll<HTMLElement>('thead th').forEach((cell) => {
      const columnId = cell.dataset.columnId;
      const width = cell.getBoundingClientRect().width;

      if (columnId && width) {
        measuredColumnWidths.current[columnId] = width;
      }
    });
  }, [isLoading, rows.length, resolvedColumnVisibility]);

  /*
   * Column widths come from the widest cell, so replacing rows with placeholders
   * would resize every column. Pinning the widths measured from the last
   * populated render holds the layout still for the duration of the request.
   */
  const isLayoutFrozen =
    isLoading &&
    table.getVisibleLeafColumns().every((column) => measuredColumnWidths.current[column.id]);

  const hasSelection = selection.selectedIds.length > 0 || selection.isAllMatchingSelected;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const pageItems = getPageItems(currentPage, totalPages);
  const shouldShowPagination = !hidePagination && totalPages > 1;

  return (
    <Flex direction="column" gap={4}>
      <Card cssOverride={cardStyles.tableCard}>
        <CardContent cssOverride={cardStyles.tableContent}>
          {hasSelection ? (
            <DataTableSelectionBar
              selection={selection}
              total={total}
              shownCount={data.length}
              bulkActions={bulkActions}
              onBulkApply={onBulkApply}
              onSelectAllMatching={handleSelectAllMatching}
              onClearSelection={handleClearSelection}
              cssOverride={styles.toolbar}
            />
          ) : (
            <Flex align="center" gap={2} cssOverride={styles.toolbarRow}>
              <div css={scoped(styles.toolbarContent)}>{toolbar}</div>
              {showColumnVisibilityMenu && (
                <DataTableColumnVisibility table={table} onToggle={toggleColumnVisibility} />
              )}
            </Flex>
          )}
          <Table
            ref={tableRef}
            density={density}
            fixed={fixed}
            cssOverride={cssOverride}
            style={isLayoutFrozen ? { tableLayout: 'fixed' } : undefined}
            aria-busy={isLoading}
          >
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const meta = header.column.columnDef.meta;
                    const isSelectColumn = header.column.id === 'select';
                    const canSort = header.column.columnDef.enableSorting ?? false;
                    const sortDirection = header.column.getIsSorted();

                    return (
                      <TableHead
                        key={header.id}
                        data-column-id={header.column.id}
                        onlyCheckbox={isSelectColumn}
                        alignment={meta?.alignment}
                        cssOverride={mergeCss(meta?.cssOverride, getPinnedCss(header.column, true))}
                        style={{
                          ...getPinningStyle(header.column),
                          width: isLayoutFrozen
                            ? `${measuredColumnWidths.current[header.column.id]}px`
                            : undefined,
                        }}
                        onClick={isSelectColumn ? (event) => event.stopPropagation() : undefined}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <Flex
                            gap={1}
                            align="center"
                            cssOverride={
                              isLoading ? styles.sortableHeaderInert : styles.sortableHeader
                            }
                            onClick={isLoading ? undefined : () => header.column.toggleSorting()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {renderSortIndicator(sortDirection)}
                          </Flex>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            {isLoading ? (
              <DataTableSkeleton
                table={table}
                rowCount={skeletonRowCount}
                rowHeight={measuredHeights.current.row}
              />
            ) : (
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={visibleColumnCount} alignment="center">
                      {emptyState ?? <DataTableEmptyState />}
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                      cssOverride={onRowClick ? styles.clickable : undefined}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta;
                        const isSelectColumn = cell.column.id === 'select';

                        return (
                          <TableCell
                            key={cell.id}
                            onlyCheckbox={isSelectColumn}
                            alignment={meta?.alignment}
                            cssOverride={mergeCss(
                              meta?.cssOverride,
                              getPinnedCss(cell.column, false),
                            )}
                            style={getPinningStyle(cell.column)}
                            onClick={
                              isSelectColumn ? (event) => event.stopPropagation() : undefined
                            }
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        </CardContent>
      </Card>
      {shouldShowPagination && (
        <Pagination disabled={isLoading}>
          <Flex align="center" justify="space-between" cssOverride={styles.paginationWrapper}>
            <PaginationPageSelect
              currentPage={currentPage}
              totalPages={totalPages}
              onChange={(page) => table.setPageIndex(page - 1)}
            />
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  disabled={!table.getCanPreviousPage()}
                  onClick={() => table.previousPage()}
                />
              </PaginationItem>
              {pageItems.map((item, index) =>
                item === ELLIPSIS ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={item === currentPage}
                      onClick={() => table.setPageIndex(item - 1)}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  disabled={!table.getCanNextPage()}
                  onClick={() => table.nextPage()}
                />
              </PaginationItem>
            </PaginationContent>
          </Flex>
        </Pagination>
      )}
    </Flex>
  );
};

DataTable.displayName = 'DataTable';

export default DataTable;
export type { DataTableProps };

const styles = defineStyles({
  clickable: {
    cursor: 'pointer',
  },
  sortableHeader: {
    cursor: 'pointer',
  },
  sortableHeaderInert: {
    cursor: 'default',
  },
  paginationWrapper: {
    width: '100%',
  },
  toolbar: {
    width: '100%',
    minHeight: '3rem',
  },
  toolbarRow: {
    width: '100%',
    minHeight: '3rem',
    paddingRight: theme.spacing[3],
  },
  toolbarContent: {
    flex: 1,
    minWidth: 0,
    marginRight: `-${theme.spacing[3]}`,
    '&:empty': {
      marginRight: theme.spacing[0],
    },
  },
});
