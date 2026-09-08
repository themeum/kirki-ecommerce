import { useCallback } from 'react';
import { useNavigate } from 'react-router';

import type { DataTableBulkAction } from '@/components/data-table';
import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import { RouteConfig } from '@/config/route-config';
import { inventoryColumns } from '@/features/inventory/components/inventory-table/columns';
import InventoryTableFilters from '@/features/inventory/components/inventory-table/inventory-table-filters';
import { useInventoryQuery } from '@/features/inventory/services/inventory';
import { inventoryListOptions } from '@/features/inventory/types';
import type { InventoryVariant } from '@/features/products';
import { useDataTableParams } from '@/hooks';
import { __ } from '@/wpi18n';

const inventoryBulkActions: DataTableBulkAction[] = [
  { value: 'bulk-edit', title: __('Bulk Edit', 'kirki-ecommerce') },
];

const InventoryTable = () => {
  const navigate = useNavigate();
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(inventoryListOptions);
  const { data, isFetching } = useInventoryQuery(params);

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
      void navigate(
        RouteConfig.Inventory.get('EditInventory').buildLink({ id: item.id }),
      );
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
      isLoading={isFetching}
      enableRowSelection
      selectionResetKey={selectionResetKey}
      bulkActions={inventoryBulkActions}
      onBulkApply={handleBulkApply}
      onRowClick={handleRowClick}
      toolbar={<InventoryTableFilters />}
    />
  );
};

InventoryTable.displayName = 'InventoryTable';

export default InventoryTable;
