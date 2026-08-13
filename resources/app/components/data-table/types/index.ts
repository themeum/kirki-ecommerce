import type { CSSObject } from '@emotion/react';
import type { CSSProperties, ReactNode } from 'react';

import type { SortableConfig } from '@/components/sorting';
import type { PaginatedData } from '@/types/api/response';
import type { TableAlignment } from '@/types/components/common';

type DataTableItem = {
  id: string | number;
};

type DataTableColumn<T> = {
  title: ReactNode;
  renderItem: (item: T) => ReactNode;
  alignment?: TableAlignment;
  sortable?: Pick<SortableConfig, 'sort_by'>
  cssOverride?: CSSObject;
  onColumnClick?: (item: T) => void;
};

type DataTableBulkApplyPayload = {
  selectedItems: (string | number)[];
  isSelectAll: boolean;
};

type DataTableRowEditAction = {
  label?: string;
  onClick: () => void;
  cssOverride?: CSSObject;
};

type DataTableRowAction = {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  cssOverride?: CSSProperties;
  type?: 'separator';
};

type DataTableRowActionsConfig = {
  edit?: DataTableRowEditAction;
  actions?: (DataTableRowAction)[];
  actionCssOverride?: CSSObject;
};

type DataTableRowActionsResolver<T> = (
  item: T,
) => DataTableRowActionsConfig | null | undefined;

const EMPTY_PAGE: PaginatedData<never> = {
  results: [],
  total: 0,
  per_page: 0,
  current_page: 1,
  last_page: 1,
};

export { EMPTY_PAGE };
export type {
  DataTableBulkApplyPayload,
  DataTableColumn,
  DataTableItem,
  DataTableRowAction,
  DataTableRowActionsConfig,
  DataTableRowActionsResolver,
  DataTableRowEditAction,
};

