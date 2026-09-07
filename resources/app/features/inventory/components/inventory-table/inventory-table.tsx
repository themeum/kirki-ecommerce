import type { VisibilityState } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import { RouteConfig } from '@/config/route-config';
import { inventoryColumns } from '@/features/inventory/components/inventory-table/columns';
import InventoryTableFilters from '@/features/inventory/components/inventory-table/inventory-table-filters';
import { inventoryTableStyles } from '@/features/inventory/components/inventory-table/inventory-table-styles';
import { allTableHeaders } from '@/features/inventory/lib/utils';
import { useInventoryQuery } from '@/features/inventory/services/inventory';
import { inventoryListOptions } from '@/features/inventory/types';
import { useDataTableParams } from '@/hooks';
import { __ } from '@/wpi18n';

const inventoryBulkActions = [{ value: 'bulk-edit', title: __('Bulk Edit', 'kirki-ecommerce') }];

const InventoryTable = () => {
  const navigate = useNavigate();
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(inventoryListOptions);
  const { data, isFetching } = useInventoryQuery(params);
  const [selectedFields, setSelectedFields] = useState(allTableHeaders.map((item) => item.value));

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
