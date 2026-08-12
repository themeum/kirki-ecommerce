import type { ReactNode } from 'react';

type DataTableSlotProps = {
  children: ReactNode;
};

const DataTableFilter = ({ children }: DataTableSlotProps) => children;

DataTableFilter.displayName = 'DataTableFilter';

const DataTableSelectionFilter = ({ children }: DataTableSlotProps) => children;

DataTableSelectionFilter.displayName = 'DataTableSelectionFilter';

/*
 * A pass-through slot: whether there is anything to show is the filter bar's
 * own business, so the table no longer has to read the URL to decide.
 */
const DataTableFilterBar = ({ children }: DataTableSlotProps) => children;

DataTableFilterBar.displayName = 'DataTableFilterBar';

export {
  DataTableFilter,
  DataTableFilterBar,
  DataTableSelectionFilter,
};
