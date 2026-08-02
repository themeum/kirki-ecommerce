import type { CSSObject } from '@emotion/react';
import type { CSSProperties, ReactNode } from 'react';

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
