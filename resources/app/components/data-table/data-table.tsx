import { useMemo, type ReactNode } from 'react';

import DataTableBody from '@/components/data-table/data-table-body';
import type { DataTableContextValue } from '@/components/data-table/data-table-context';
import { DataTableContext } from '@/components/data-table/data-table-context';
import DataTableHeader from '@/components/data-table/data-table-header';
import DataTablePagination from '@/components/data-table/data-table-pagination';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import { DataTableSelectionProvider, useDataTableSelection } from '@/components/data-table/data-table-selection-context';
import { DataTableFilter, DataTableFilterBar, DataTableSelectionFilter, findSlot } from '@/components/data-table/data-table-slots';
import DataTableToolbar from '@/components/data-table/data-table-toolbar';
import { EMPTY_PAGE, type DataTableBulkApplyPayload, type DataTableColumn, type DataTableItem, type DataTableRowActionsResolver } from '@/components/data-table/types';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { cardStyles } from '@/theme/card-styles';
import type { PaginatedData, SelectOption, SortOrder } from '@/types';
import { isDefined } from '@/utils/object';

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

const DataTableLayout = <T extends DataTableItem>({
  data,
  columns,
  rowActions,
  bulkActionOptions,
  onBulkApply,
  onPageChange,
  fixed = true,
  children,
  isLoading = false,
  onSort,
  sortBy,
  sortOrder
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
      data: data as unknown as PaginatedData<DataTableItem>,
      isLoading,
      columns: resolvedColumns as unknown as DataTableColumn<DataTableItem>[],
      onPageChange,
    }),
    [data, isLoading, resolvedColumns, onPageChange],
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
            {isDefined(filterBar) && (
              <>
                {filterBar}
              </>
            )}

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
  const tableData = (data ?? EMPTY_PAGE) as PaginatedData<T>;

  return (
    <DataTableSelectionProvider
      data={tableData as unknown as PaginatedData<DataTableItem>}
    >
      <DataTableLayout {...rest} data={tableData} />
    </DataTableSelectionProvider>
  );
};

DataTable.displayName = 'DataTable';

export default DataTable;
export type { DataTableProps };
