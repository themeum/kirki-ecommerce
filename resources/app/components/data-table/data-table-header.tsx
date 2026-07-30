import { memo } from 'react';

import type {
  DataTableColumn,
  DataTableItem,
} from '@/components/data-table/types';
import Checkbox from '@/components/ui/checkbox';
import { TableHead, TableRow } from '@/components/ui/table';

type DataTableHeaderProps = {
  columns: DataTableColumn<DataTableItem>[];
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  onToggleAll: () => void;
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
          {column.title}
        </TableHead>
      ))}
    </TableRow>
  ),
);

DataTableHeader.displayName = 'DataTableHeader';

export default DataTableHeader;
