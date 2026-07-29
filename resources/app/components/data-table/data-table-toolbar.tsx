import type { ReactNode } from 'react';

import BulkActionHandler from '@/components/bulk-action-handler';
import { useDataTableSelection } from '@/components/data-table/data-table-selection-context';
import type { DataTableBulkApplyPayload } from '@/components/data-table/types';
import type { SelectOption } from '@/types';

type DataTableToolbarProps = {
  action?: ReactNode;
  filterAction?: ReactNode;
  bulkActionOptions?: SelectOption[];
  onBulkApply?: (
    action: string,
    payload: DataTableBulkApplyPayload,
  ) => void | Promise<void>;
  total: number;
  perPage: number;
};

/*
 * Split out so that toggling into bulk-selection mode repaints the toolbar
 * only, instead of the whole card.
 */
const DataTableToolbar = ({
  action,
  filterAction,
  bulkActionOptions,
  onBulkApply,
  total,
  perPage,
}: DataTableToolbarProps) => {
  const { selectedItems, itemCount, onSelectAll, onClearSelection } =
    useDataTableSelection();

  if (!selectedItems.length) {
    return action ?? null;
  }

  const handleApplyAction = async (bulkAction: string) => {
    if (!onBulkApply) {
      return;
    }

    await onBulkApply(bulkAction, {
      selectedItems,
      isSelectAll: selectedItems.includes('*'),
    });
    onClearSelection();
  };

  return (
    <BulkActionHandler
      optionsArray={bulkActionOptions}
      itemCount={itemCount}
      onSelectAll={itemCount === total ? onClearSelection : onSelectAll}
      onApply={(bulkAction) => handleApplyAction(bulkAction as string)}
      filterAction={filterAction}
      total={total}
      per_page={perPage}
    />
  );
};

DataTableToolbar.displayName = 'DataTableToolbar';

export default DataTableToolbar;
