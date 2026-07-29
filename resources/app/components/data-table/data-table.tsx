import { useMemo, type ReactNode } from 'react';

import DataTableBody from '@/components/data-table/data-table-body';
import type { DataTableContextValue } from '@/components/data-table/data-table-context';
import { DataTableContext } from '@/components/data-table/data-table-context';
import DataTableHeader from '@/components/data-table/data-table-header';
import DataTablePagination from '@/components/data-table/data-table-pagination';
import {
  DataTableSelectionProvider,
  useDataTableSelection,
} from '@/components/data-table/data-table-selection-context';
import {
  DataTableFilter,
  DataTableFilterBar,
  DataTableSelectionFilter,
  findSlot,
} from '@/components/data-table/data-table-slots';
import DataTableToolbar from '@/components/data-table/data-table-toolbar';
import {
  EMPTY_PAGE,
  type DataTableBulkApplyPayload,
  type DataTableColumn,
  type DataTableItem,
} from '@/components/data-table/types';
import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import {
  Table,
  TableBody,
  TableHeader,
} from '@/components/ui/table';
import { ListParamsProvider } from '@/contexts/list-params-context';
import type { UseListParamsOptions } from '@/hooks/use-list-params';
import { cardStyles } from '@/theme/card-styles';
import type { PaginatedData, SelectOption } from '@/types';

type DataTableProps<
  T extends DataTableItem,
  TFilter extends Record<string, unknown> = {},
> = {
  listOptions: UseListParamsOptions<TFilter>;
  data?: PaginatedData<T>;
  columns: DataTableColumn<T>[];
  bulkActionOptions?: SelectOption[];
  onBulkApply?: (
    action: string,
    payload: DataTableBulkApplyPayload,
  ) => void | Promise<void>;
  onPageChange: (page: number) => void;
  fixed?: boolean;
  children?: ReactNode;
  isLoading?: boolean;
};

type DataTableLayoutProps<T extends DataTableItem> = Omit<
  DataTableProps<T>,
  'listOptions' | 'data'
> & {
  data: PaginatedData<T>;
};

const DataTableLayout = <T extends DataTableItem>({
  data,
  columns,
  bulkActionOptions,
  onBulkApply,
  onPageChange,
  fixed = true,
  children,
  isLoading = false,
}: DataTableLayoutProps<T>) => {
  const { total, per_page } = data;
  const { isAllSelected, isPartiallySelected, onToggleAll } =
    useDataTableSelection();

  const action = findSlot(children, DataTableFilter);
  const filterAction = findSlot(children, DataTableSelectionFilter);
  const filterBar = findSlot(children, DataTableFilterBar);
  const pagination = findSlot(children, DataTablePagination);

  const contextValue = useMemo<DataTableContextValue<DataTableItem>>(
    () => ({
      data: data as unknown as PaginatedData<DataTableItem>,
      isLoading,
      columns: columns as unknown as DataTableColumn<DataTableItem>[],
      onPageChange,
    }),
    [data, isLoading, columns, onPageChange],
  );

  return (
    <DataTableContext.Provider value={contextValue}>
      <Flex direction="column" gap={4}>
        <Card css={cardStyles.tableCard}>
          <CardContent css={cardStyles.tableContent}>
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
                  columns={columns as unknown as DataTableColumn<DataTableItem>[]}
                  isAllSelected={isAllSelected}
                  isPartiallySelected={isPartiallySelected}
                  onToggleAll={onToggleAll}
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

/*
 * DataTable owns the list-params provider for its own subtree, so the toolbar,
 * filter popup and filter bar all share one URL subscription. Slot children are
 * created by the consumer but rendered here, and React resolves context by
 * render position — so they read this provider, not the page's.
 */
const DataTable = <
  T extends DataTableItem,
  TFilter extends Record<string, unknown> = {},
>({
  listOptions,
  data,
  ...rest
}: DataTableProps<T, TFilter>) => {
  const tableData = (data ?? EMPTY_PAGE) as PaginatedData<T>;

  return (
    <ListParamsProvider options={listOptions}>
      <DataTableSelectionProvider
        data={tableData as unknown as PaginatedData<DataTableItem>}
      >
        <DataTableLayout {...rest} data={tableData} />
      </DataTableSelectionProvider>
    </ListParamsProvider>
  );
};

DataTable.displayName = 'DataTable';

export default DataTable;
export type { DataTableProps };
