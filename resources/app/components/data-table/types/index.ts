import type { ReactNode } from 'react';

import type { PaginatedData, TableAlignment } from '@/types';

type DataTableItem = {
  id: string | number;
};

type DataTableColumn<T> = {
  title: string;
  renderItem: (item: T) => ReactNode;
  alignment?: TableAlignment;
};

type DataTableBulkApplyPayload = {
  selectedItems: (string | number)[];
  isSelectAll: boolean;
};

const EMPTY_PAGE: PaginatedData<never> = {
  results: [],
  total: 0,
  per_page: 0,
  current_page: 1,
  last_page: 1,
};

export { EMPTY_PAGE };
export type { DataTableBulkApplyPayload, DataTableColumn, DataTableItem };
