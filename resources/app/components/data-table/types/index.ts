import type { CSSObject } from '@emotion/react';
import type { CSSProperties, ReactNode } from 'react';

type DataTableItem = {
  id: string | number;
};

type DataTableSelectionState = {
  selectedIds: string[];
  isAllMatchingSelected: boolean;
  selectedCount: number;
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

export type {
  DataTableItem,
  DataTableRowAction,
  DataTableRowActionsConfig,
  DataTableRowEditAction,
  DataTableSelectionState,
};

