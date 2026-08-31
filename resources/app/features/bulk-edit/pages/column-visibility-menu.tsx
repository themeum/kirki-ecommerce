import { Table2 } from 'lucide-react';

import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BulkEditColumnGroup } from '@/features/bulk-edit/lib/columns';
import { __ } from '@/wpi18n';

type ColumnVisibilityMenuProps = {
  groups: (BulkEditColumnGroup & { columns: { id: string; label: string }[] })[];
  visibleColumnIds: string[];
  onToggle: (columnId: string) => void;
};

/**
 * Every checkbox item prevents its own `onSelect` default — Radix's
 * `DropdownMenuCheckboxItem` closes the menu on select otherwise, which
 * made toggling several columns in one session unreliable (see
 * bulk-edit-grid-refinements/design.md, decision 5). The menu should close
 * only on an explicit outside click or Escape, both of which Radix already
 * handles without any `onSelect` involvement.
 */
const preventAutoClose = (event: Event) => event.preventDefault();

const ColumnVisibilityMenu = ({ groups, visibleColumnIds, onToggle }: ColumnVisibilityMenuProps) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline">
        <Table2 size={16} aria-hidden="true" />
        {__('Columns', 'kirki-ecommerce')}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent style={{ minWidth: '288px' }}>
      <DropdownMenuCheckboxItem checked disabled onSelect={preventAutoClose}>
        {__('Variants', 'kirki-ecommerce')}
      </DropdownMenuCheckboxItem>
      {groups.map((group) => (
        <div key={group.label}>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
          {group.columns.map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={visibleColumnIds.includes(column.id)}
              onSelect={preventAutoClose}
              onCheckedChange={() => onToggle(column.id)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          ))}
        </div>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

ColumnVisibilityMenu.displayName = 'ColumnVisibilityMenu';

export default ColumnVisibilityMenu;
