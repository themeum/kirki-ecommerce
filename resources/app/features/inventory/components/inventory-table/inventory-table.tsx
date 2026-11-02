import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import type { DataTableBulkAction, DataTableSelectionState } from '@/components/data-table';
import DataTable, { DataTableEmptyState } from '@/components/data-table';
import Button from '@/components/ui/button';
import { RouteConfig } from '@/config/route-config';
import { inventoryColumns } from '@/features/inventory/components/inventory-table/columns';
import InventoryTableFilters from '@/features/inventory/components/inventory-table/inventory-table-filters';
import type { InventoryListFilter } from '@/features/inventory/types';
import { inventoryListOptions } from '@/features/inventory/types';
import type { InventoryVariant } from '@/features/products';
import { useDataTableParams } from '@/hooks';
import type { ListingTableProps } from '@/types/pages/common';
import { __ } from '@/wpi18n';

const inventoryBulkActions: DataTableBulkAction[] = [
  { value: 'bulk-edit', title: __('Bulk Edit', 'kirki-ecommerce') },
];

const InventoryTable = ({ data, isLoading = false }: ListingTableProps<InventoryVariant>) => {
  const navigate = useNavigate();
  const {
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    clearFilters,
  } = useDataTableParams<InventoryListFilter>(inventoryListOptions);

  const handleBulkApply = useCallback(
    (action: string, { selectedIds }: DataTableSelectionState) => {
      if (action !== 'bulk-edit') {
        return;
      }

      void navigate(`${RouteConfig.BulkVariants.buildLink()}?ids=${selectedIds.join(',')}`);
    },
    [navigate],
  );

  const handleRowClick = useCallback(
    (item: InventoryVariant) => {
      void navigate(RouteConfig.Inventory.get('EditInventory').buildLink({ id: item.id }));
    },
    [navigate],
  );

  return (
    <DataTable
      tableId="inventory"
      data={data?.results ?? []}
      columns={inventoryColumns}
      pageCount={data?.last_page ?? 0}
      total={data?.total}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={isLoading}
      enableRowSelection
      /**
       * Bulk edit opens the grid on an enumerated `ids` list, so it can only
       * ever address the rows the merchant actually ticked. Offering "select
       * all N items" here would promise a set the action cannot carry.
       */
      enableSelectAllMatching={false}
      selectionResetKey={selectionResetKey}
      bulkActions={inventoryBulkActions}
      onBulkApply={handleBulkApply}
      onRowClick={handleRowClick}
      toolbar={<InventoryTableFilters />}
      emptyState={
        <DataTableEmptyState
          title={__('No inventory items found', 'kirki-ecommerce')}
          actions={
            <Button variant="secondary" onClick={clearFilters}>
              {__('Clear Search', 'kirki-ecommerce')}
            </Button>
          }
        />
      }
    />
  );
};

InventoryTable.displayName = 'InventoryTable';

export default InventoryTable;
