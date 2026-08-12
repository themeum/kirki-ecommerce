import { Children, isValidElement, type ReactElement, type ReactNode, useMemo } from 'react';

import DataTableBody from '@/components/data-table/data-table-body';
import type { DataTableContextValue } from '@/components/data-table/data-table-context';
import { DataTableContext } from '@/components/data-table/data-table-context';
import DataTableHeader from '@/components/data-table/data-table-header';
import DataTablePagination from '@/components/data-table/data-table-pagination';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import { DataTableSelectionProvider, useDataTableSelection } from '@/components/data-table/data-table-selection-context';
import { DataTableFilter, DataTableFilterBar, DataTableSelectionFilter } from '@/components/data-table/data-table-slots';
import DataTableToolbar from '@/components/data-table/data-table-toolbar';
import { type DataTableBulkApplyPayload, type DataTableColumn, type DataTableItem, type DataTableRowActionsResolver, EMPTY_PAGE } from '@/components/data-table/types';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { cardStyles } from '@/theme/card-styles';
import type { PaginatedData, SelectOption, SortOrder } from '@/types';

type DataTableProps<T extends DataTableItem> = {
  data?: PaginatedData<T>;
  columns: DataTableColumn<T>[];
  rowActions?: DataTableRowActionsResolver<T>;
  bulkActionOptions?: SelectOption[];
  onBulkApply?: (
    action: string,
    payload: DataTableBulkApplyPayload,
  ) => void | Promise<void>;
  onPageChange: (page: number) => void;
  onRowClick?: (item: T) => void;
  fixed?: boolean;
  children?: ReactNode;
  isLoading?: boolean;
  onSort?: (sortBy: string, sortOrder: SortOrder) => void
  sortBy?: string
  sortOrder?: SortOrder
};

type DataTableLayoutProps<T extends DataTableItem> = Omit<
  DataTableProps<T>,
  'data'
> & {
  data: PaginatedData<T>;
};

const findSlot = (children: ReactNode, type: unknown) => {
  let match: ReactElement | undefined;

  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.type === type) {
      match = child;
    }
  });

  return match;
};

const DataTableLayout = <T extends DataTableItem>({
  data,
  columns,
  rowActions,
  bulkActionOptions,
  onBulkApply,
  onPageChange,
  onRowClick,
  fixed = false,
  children,
  isLoading = false,
  onSort,
  sortBy,
  sortOrder,
}: DataTableLayoutProps<T>) => {
  const { total, per_page } = data;
  const { isAllSelected, isPartiallySelected, onToggleAll } =
    useDataTableSelection();

  const action = findSlot(children, DataTableFilter);
  const filterAction = findSlot(children, DataTableSelectionFilter);
  const filterBar = findSlot(children, DataTableFilterBar);
  const pagination = findSlot(children, DataTablePagination);

  const resolvedColumns = useMemo<DataTableColumn<T>[]>(() => {
    if (!rowActions) {
      return columns;
    }

    return [
      ...columns,
      {
        title: '',
        alignment: 'right',
        renderItem: (item: T) => {
          const config = rowActions(item);
          return config ? <DataTableRowActions edit={config.edit} actions={config.actions} /> : null;
        },
      },
    ];
  }, [columns, rowActions]);

  const contextValue = useMemo<DataTableContextValue<DataTableItem>>(
    () => ({
      data,
      isLoading,
      columns: resolvedColumns as unknown as DataTableColumn<DataTableItem>[],
      onPageChange,
      onRowClick: onRowClick as unknown as DataTableContextValue<DataTableItem>['onRowClick'],
    }),
    [data, isLoading, resolvedColumns, onPageChange, onRowClick],
  );

  return (
    <DataTableContext.Provider value={contextValue}>
      <Flex direction="column" gap={4}>
        <Card cssOverride={cardStyles.tableCard}>
          <CardContent cssOverride={cardStyles.tableContent}>
            <DataTableToolbar
              action={action}
              filterAction={filterAction}
              bulkActionOptions={bulkActionOptions}
              onBulkApply={onBulkApply}
              total={total}
              perPage={per_page}
            />
            {filterBar}
            <Table fixed={fixed}>
              <TableHeader>
                <DataTableHeader
                  columns={resolvedColumns as unknown as DataTableColumn<DataTableItem>[]}
                  isAllSelected={isAllSelected}
                  isPartiallySelected={isPartiallySelected}
                  onToggleAll={onToggleAll}
                  onSort={onSort}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                />
              </TableHeader>
              <TableBody>
                <DataTableBody />
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        {pagination}
      </Flex>
    </DataTableContext.Provider>
  );
};

const DataTable = <T extends DataTableItem>({
  data,
  ...rest
}: DataTableProps<T>) => {
  const tableData = (data ?? EMPTY_PAGE);

  return (
    <DataTableSelectionProvider
      data={tableData}
    >
      <DataTableLayout {...rest} data={tableData} />
    </DataTableSelectionProvider>
  );
};

DataTable.displayName = 'DataTable';

export default DataTable;
export type { DataTableProps };
