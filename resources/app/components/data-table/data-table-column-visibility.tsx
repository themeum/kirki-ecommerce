import type { Column, Table } from '@tanstack/react-table';
import { Columns3 } from 'lucide-react';

import type { DataTableItem } from '@/components/data-table/types';
import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { __ } from '@/wpi18n';

type DataTableColumnVisibilityProps<T extends DataTableItem> = {
  table: Table<T>;
  onToggle: (columnId: string, isVisible: boolean) => void;
};

/**
 * Radix dismisses the menu when an item is selected, which made toggling several
 * columns in one sitting impossible. Preventing the default leaves dismissal to
 * an outside click or Escape, both of which Radix already handles.
 */
const preventAutoClose = (event: Event) => event.preventDefault();

const isToggleable = <T extends DataTableItem>(column: Column<T>) => {
  const header = column.columnDef.header;

  return (
    column.id !== 'select' && column.getCanHide() && typeof header === 'string' && header !== ''
  );
};

const DataTableColumnVisibility = <T extends DataTableItem>(
  props: DataTableColumnVisibilityProps<T>,
) => {
  const { table, onToggle } = props;

  const columns = table.getAllLeafColumns().filter(isToggleable);
  const isLastVisible = columns.filter((column) => column.getIsVisible()).length === 1;

  if (columns.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label={__('Columns', 'kirki-ecommerce')}
          title={__('Columns', 'kirki-ecommerce')}
        >
          <Columns3 size={16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((column) => {
          const isVisible = column.getIsVisible();

          return (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={isVisible}
              disabled={isVisible && isLastVisible}
              onSelect={preventAutoClose}
              onCheckedChange={(checked) => onToggle(column.id, checked)}
            >
              {column.columnDef.header as string}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

DataTableColumnVisibility.displayName = 'DataTableColumnVisibility';

export default DataTableColumnVisibility;
export type { DataTableColumnVisibilityProps };
