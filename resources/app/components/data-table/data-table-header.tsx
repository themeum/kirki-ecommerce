import { memo } from 'react';

import type {
  DataTableColumn,
  DataTableItem,
} from '@/components/data-table/types';
import Sorting from '@/components/sorting';
import Checkbox from '@/components/ui/checkbox';
import { TableHead, TableRow } from '@/components/ui/table';
import type { SortOrder } from '@/types';

type DataTableHeaderProps = {
  columns: DataTableColumn<DataTableItem>[];
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  onToggleAll: () => void;
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (sortBy: string, sortOrder: SortOrder) => void;
};

/*
 * Props only — no data context. With a module-scope `columns` array and the
 * stable `onToggleAll` from the selection provider, a search leaves every prop
 * untouched and this bails out instead of re-rendering with the rows.
 */
const DataTableHeader = memo(
  ({
    columns,
    isAllSelected,
    isPartiallySelected,
    onToggleAll,
    sortBy,
    sortOrder,
    onSort,
  }: DataTableHeaderProps) => (
    <TableRow>
      <TableHead onlyCheckbox>
        <Checkbox
          value={isAllSelected}
          onChange={onToggleAll}
          isPartialChecked={isPartiallySelected}
        />
      </TableHead>
      {columns.map((column, index) => (
        <TableHead key={index} alignment={column.alignment}>
          {column.sortable && onSort ? (
            <Sorting
              data={{
                title: column.title,
                sortable: {
                  activeSortBy: sortBy,
                  sortOrder,
                  onSort,
                  ...column.sortable,
                },
              }}
            />
          ) : (
            column.title
          )}
        </TableHead>
      ))}
    </TableRow>
  ),
);

DataTableHeader.displayName = 'DataTableHeader';

export default DataTableHeader;
