import { createContext, useContext } from 'react';

import type {
  DataTableColumn,
  DataTableItem,
} from '@/components/data-table/types';
import type { PaginatedData, SortOrder } from '@/types';

/*
 * Only DataTableBody and DataTablePagination read this, and both are supposed
 * to re-render when the data changes — so one context is enough. Anything that
 * must survive a data change (the header, the toolbar) takes props instead.
 */
type DataTableContextValue<T extends DataTableItem> = {
  data: PaginatedData<T>;
  isLoading: boolean;
  columns: DataTableColumn<T>[];
  onPageChange: (page: number) => void;
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (sortBy: string, sortOrder: SortOrder) => void;
};

const DataTableContext =
  createContext<DataTableContextValue<DataTableItem> | null>(null);

const useDataTableContext = <T extends DataTableItem>() => {
  const context = useContext(DataTableContext);

  if (!context) {
    throw new Error(
      'DataTable sub-components must be rendered within a <DataTable>.',
    );
  }

  return context as unknown as DataTableContextValue<T>;
};

export { DataTableContext, useDataTableContext };
export type { DataTableContextValue };

