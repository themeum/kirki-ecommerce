import type { VisibilityState } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import { RouteConfig } from '@/config/route-config';
import { useInventoryForm } from '@/features/inventory';
import { allTableHeaders } from '@/features/inventory/lib/utils';
import { inventoryColumns } from '@/features/inventory/pages/inventory-table/columns';
import InventoryTableFilters from '@/features/inventory/pages/inventory-table/inventory-table-filters';
import { inventoryTableStyles } from '@/features/inventory/pages/inventory-table/inventory-table-styles';
import { inventoryListOptions } from '@/features/inventory/types';
import type { InventoryVariant } from '@/features/products';
import { useDataTableParams } from '@/hooks';
import { __ } from '@/wpi18n';

const inventoryBulkActions = [{ value: 'bulk-edit', title: __('Bulk Edit', 'kirki-ecommerce') }];

const InventoryTable = () => {
  const navigate = useNavigate();
  const { data, loaded } = useInventoryForm();
  const { pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(inventoryListOptions);
  const [selectedFields, setSelectedFields] = useState(allTableHeaders.map((item) => item.value));

  const rows = useMemo<InventoryVariant[]>(() => Object.values(data?.results ?? {}), [data]);

  const columnVisibility = useMemo<VisibilityState>(
    () => Object.fromEntries(allTableHeaders.map((header) => [header.value, selectedFields.includes(header.value)])),
    [selectedFields],
  );

  const handleBulkApply = useCallback(
    (action: string, { selectedIds }: DataTableSelectionState) => {
      if (action !== 'bulk-edit') {
        return;
      }

      void navigate(`${RouteConfig.BulkVariants.buildLink()}?ids=${selectedIds.join(',')}`);
    },
    [navigate],
  );

  return (
    <DataTable
      data={rows}
      columns={inventoryColumns}
      pageCount={data?.last_page ?? 0}
      total={data?.total}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={!loaded}
      enableRowSelection
      selectionResetKey={selectionResetKey}
      bulkActionOptions={inventoryBulkActions}
      onBulkApply={handleBulkApply}
      columnVisibility={columnVisibility}
      cssOverride={inventoryTableStyles}
      toolbar={<InventoryTableFilters selectedFields={selectedFields} setSelectedFields={setSelectedFields} />}
    />
  );
};

InventoryTable.displayName = 'InventoryTable';

export default InventoryTable;
