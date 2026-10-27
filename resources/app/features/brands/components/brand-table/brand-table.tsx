import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { DataTableBulkAction, DataTableSelectionState } from '@/components/data-table';
import DataTable, { DataTableEmptyState } from '@/components/data-table';
import { actionsColumnMeta } from '@/components/data-table/column-styles';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import Button from '@/components/ui/button';
import BrandAddEditPopover from '@/features/brands/components/brand-add-edit-dialog';
import BrandTableFilters from '@/features/brands/components/brand-table/brand-table-filters';
import { createBrandColumns } from '@/features/brands/components/brand-table/columns';
import type { Brand } from '@/features/brands/schemas/catalog/brand';
import {
  useBulkDeleteBrandsMutation,
  useDeleteBrandMutation,
} from '@/features/brands/services/brand';
import { brandListOptions } from '@/features/brands/types';
import { useConfirmDelete, useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import type { ListingTableProps } from '@/types/pages/common';
import { __ } from '@/wpi18n';

const brandBulkActions: DataTableBulkAction[] = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce'), destructive: true },
];

const BrandTable = ({ data, isLoading = false }: ListingTableProps<Brand>) => {
  const {
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    clearFilters,
  } = useDataTableParams(brandListOptions);

  const deleteMutation = useDeleteBrandMutation();
  const bulkDeleteMutation = useBulkDeleteBrandsMutation();
  const { confirmDelete, confirmDeleteAsync, deleteConfirmation } = useConfirmDelete();
  const [editingItem, setEditingItem] = useState<Brand | null>(null);

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      if (
        !(await confirmDeleteAsync({
          title: __('Delete selected brands?', 'kirki-ecommerce'),
          description: __(
            'The selected brands will be permanently deleted. This cannot be undone.',
            'kirki-ecommerce',
          ),
        }))
      ) {
        // Rejecting keeps the row selection so the action can be retried.
        throw new Error('Bulk delete cancelled');
      }

      await bulkDeleteMutation.mutateAsync(
        resolveBulkDeletePayload(isAllMatchingSelected, selectedIds),
      );
    },
    [bulkDeleteMutation, confirmDeleteAsync],
  );

  const columns = useMemo<ColumnDef<Brand>[]>(
    () => [
      ...createBrandColumns({ onEdit: setEditingItem }),
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: actionsColumnMeta,
        cell: ({ row }) => (
          <DataTableRowActions
            edit={{ onClick: () => setEditingItem(row.original) }}
            actions={[
              {
                label: __('Delete', 'kirki-ecommerce'),
                icon: <Trash2 size={16} />,
                destructive: true,
                onClick: () =>
                  confirmDelete(
                    {
                      title: __('Delete brand?', 'kirki-ecommerce'),
                      description: __(
                        'This brand will be permanently deleted. This cannot be undone.',
                        'kirki-ecommerce',
                      ),
                    },
                    () => deleteMutation.mutate(row.original.id),
                  ),
              },
            ]}
          />
        ),
      },
    ],
    [confirmDelete, deleteMutation],
  );

  return (
    <>
      <DataTable
        tableId="brands"
        data={data?.results ?? []}
        columns={columns}
        total={data?.total}
        pageCount={data?.last_page ?? 0}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        isLoading={isLoading}
        enableRowSelection
        selectionResetKey={selectionResetKey}
        bulkActions={brandBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        density="compact"
        toolbar={<BrandTableFilters />}
        emptyState={
          <DataTableEmptyState
            title={__('No brands found', 'kirki-ecommerce')}
            actions={
              <Button variant="secondary" onClick={clearFilters}>
                {__('Clear Search', 'kirki-ecommerce')}
              </Button>
            }
          />
        }
      />
      {deleteConfirmation}
      {editingItem && (
        <BrandAddEditPopover
          key={editingItem.id}
          brand={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  );
};

BrandTable.displayName = 'BrandTable';

export default BrandTable;
