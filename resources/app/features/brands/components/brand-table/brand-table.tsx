import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import BrandAddEditPopover from '@/features/brands/components/brand-add-edit-dialog';
import BrandTableFilters from '@/features/brands/components/brand-table/brand-table-filters';
import { brandColumns } from '@/features/brands/components/brand-table/columns';
import type { Brand } from '@/features/brands/schemas/catalog/brand';
import { useBrandsQuery, useBulkDeleteBrandsMutation, useDeleteBrandMutation } from '@/features/brands/services/brand';
import { brandListOptions } from '@/features/brands/types';
import { useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { __ } from '@/wpi18n';

const brandBulkActions = [{ value: 'delete', title: __('Trash', 'kirki-ecommerce') }];

const BrandTable = () => {
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(brandListOptions);

  const { data, isFetching } = useBrandsQuery(params);
  const deleteMutation = useDeleteBrandMutation();
  const bulkDeleteMutation = useBulkDeleteBrandsMutation();
  const [editingItem, setEditingItem] = useState<Brand | null>(null);

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      await bulkDeleteMutation.mutateAsync(resolveBulkDeletePayload(isAllMatchingSelected, selectedIds));
    },
    [bulkDeleteMutation],
  );

  const columns = useMemo<ColumnDef<Brand>[]>(
    () => [
      ...brandColumns,
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <DataTableRowActions
            edit={{ onClick: () => setEditingItem(row.original) }}
            actions={[
              {
                label: __('Delete', 'kirki-ecommerce'),
                icon: <Trash2 size={16} />,
                destructive: true,
                onClick: () => deleteMutation.mutate(row.original.id),
              },
            ]}
          />
        ),
      },
    ],
    [deleteMutation],
  );

  return (
    <>
      <DataTable
        data={data?.results ?? []}
        columns={columns}
        total={data?.total}
        pageCount={data?.last_page ?? 0}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        isLoading={isFetching}
        enableRowSelection
        selectionResetKey={selectionResetKey}
        bulkActionOptions={brandBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        density="compact"
        toolbar={<BrandTableFilters />}
      />
      {editingItem && (
        <BrandAddEditPopover key={editingItem.id} brand={editingItem} onClose={() => setEditingItem(null)} />
      )}
    </>
  );
};

BrandTable.displayName = 'BrandTable';

export default BrandTable;
