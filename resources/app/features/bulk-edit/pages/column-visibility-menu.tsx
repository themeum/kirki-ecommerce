import { Table2 } from 'lucide-react';

import Button from '@/components/ui/button';
import Checkbox from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
 * Every item prevents its own `onSelect` default — Radix's
 * `DropdownMenuItem` closes the menu on select otherwise, which
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
      <DropdownMenuItem disabled onSelect={preventAutoClose}>
        <Checkbox checked disabled tabIndex={-1} label={__('Variants', 'kirki-ecommerce')} />
      </DropdownMenuItem>
      {groups.map((group) => (
        <div key={group.label}>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
          {group.columns.map((column) => (
            <DropdownMenuItem
              key={column.id}
              onSelect={(event) => {
                preventAutoClose(event);
                onToggle(column.id);
              }}
            >
              <Checkbox
                checked={visibleColumnIds.includes(column.id)}
                tabIndex={-1}
                label={column.label}
                onCheckedChange={() => onToggle(column.id)}
              />
            </DropdownMenuItem>
          ))}
        </div>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
);

ColumnVisibilityMenu.displayName = 'ColumnVisibilityMenu';

export default ColumnVisibilityMenu;
