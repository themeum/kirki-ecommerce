import type { CSSObject } from '@emotion/react';
import type {
  ColumnDef,
  ColumnPinningState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPinnedCss, getPinningStyle } from '@/components/data-table/column-styles';
import DataTableEmptyState from '@/components/data-table/data-table-empty-state';
import DataTableSelectionBar from '@/components/data-table/data-table-selection-bar';
import DataTableSkeleton from '@/components/data-table/data-table-skeleton';
import type { DataTableItem, DataTableSelectionState } from '@/components/data-table/types';
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
import { ArrowDownUpFilled } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import type { SelectOption, TableDensity } from '@/types/components/common';
import { ELLIPSIS, getPageItems } from '@/utils/pagination';

type DataTableProps<T extends DataTableItem> = {
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
  filterBar?: ReactNode;
  onRowClick?: (item: T) => void;
  density?: TableDensity;
  fixed?: boolean;
  cssOverride?: CSSObject;
  hidePagination?: boolean;
  enableRowSelection?: boolean;
  selectionResetKey?: string | number;
  onRowSelectionChange?: (state: DataTableSelectionState) => void;
  bulkActionOptions?: SelectOption[];
  onBulkApply?: (action: string, selection: DataTableSelectionState) => void | Promise<void>;
  columnPinning?: ColumnPinningState;
  columnVisibility?: VisibilityState;
};

const EMPTY_COLUMN_PINNING: ColumnPinningState = {};
const EMPTY_COLUMN_VISIBILITY: VisibilityState = {};

const noop = () => undefined;

const DataTable = <T extends DataTableItem>(props: DataTableProps<T>) => {
  const {
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
    filterBar,
    onRowClick,
    density,
    fixed,
    cssOverride,
    hidePagination = false,
    enableRowSelection = false,
    selectionResetKey,
    onRowSelectionChange,
    bulkActionOptions,
    onBulkApply,
    columnPinning = EMPTY_COLUMN_PINNING,
    columnVisibility = EMPTY_COLUMN_VISIBILITY,
  } = props;

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
    enableSortingRemoval: false,
    enableRowSelection,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    state: {
      pagination,
      sorting,
      rowSelection,
      columnPinning,
      columnVisibility,
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
  const measuredHeights = useRef<{ header?: number; row?: number }>({});

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const headerHeight = tableRef.current
      ?.querySelector('thead tr')
      ?.getBoundingClientRect().height;
    if (headerHeight) {
      measuredHeights.current.header = headerHeight;
    }

    if (rows.length === 0) {
      return;
    }

    const rowHeight = tableRef.current?.querySelector('tbody tr')?.getBoundingClientRect().height;
    if (rowHeight) {
      measuredHeights.current.row = rowHeight;
    }
  }, [isLoading, rows.length]);

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
              bulkActionOptions={bulkActionOptions}
              onBulkApply={onBulkApply}
              onSelectAllMatching={handleSelectAllMatching}
              onClearSelection={handleClearSelection}
              cssOverride={styles.toolbar}
            />
          ) : (
            <div css={scoped(styles.toolbar)}>{toolbar}</div>
          )}
          {filterBar}
          <Table
            ref={tableRef}
            density={density}
            fixed={fixed}
            cssOverride={cssOverride}
            aria-busy={isLoading}
          >
            {isLoading ? (
              <DataTableSkeleton
                table={table}
                rowCount={skeletonRowCount}
                headerHeight={measuredHeights.current.header}
                rowHeight={measuredHeights.current.row}
              />
            ) : (
              <>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef.meta;
                        const isSelectColumn = header.column.id === 'select';
                        const canSort = header.column.getCanSort();

                        return (
                          <TableHead
                            key={header.id}
                            onlyCheckbox={isSelectColumn}
                            alignment={meta?.alignment}
                            cssOverride={mergeCss(
                              meta?.cssOverride,
                              getPinnedCss(header.column, true),
                            )}
                            style={getPinningStyle(header.column)}
                            onClick={
                              isSelectColumn ? (event) => event.stopPropagation() : undefined
                            }
                          >
                            {header.isPlaceholder ? null : canSort ? (
                              <Flex
                                gap={1}
                                align="center"
                                cssOverride={mergeCss(
                                  styles.sortableHeader,
                                  header.column.getIsSorted() && styles.sortableHeaderActive,
                                )}
                                onClick={() => header.column.toggleSorting()}
                              >
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                <ArrowDownUpFilled
                                  top={
                                    header.column.getIsSorted() === 'desc'
                                      ? theme.colors.background.fillBrand
                                      : theme.colors.icon.secondary
                                  }
                                  bottom={
                                    header.column.getIsSorted() === 'asc'
                                      ? theme.colors.background.fillBrand
                                      : theme.colors.icon.secondary
                                  }
                                />
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
              </>
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
  sortableHeaderActive: {
    color: theme.colors.background.fillBrand,
  },
  paginationWrapper: {
    width: '100%',
  },
  toolbar: {
    width: '100%',
    minHeight: theme.spacing[12],
  },
});
