import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import type { DataTableBulkAction, DataTableSelectionState } from '@/components/data-table';
import DataTable, { DataTableEmptyState } from '@/components/data-table';
import { actionsColumnMeta } from '@/components/data-table/column-styles';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import Button from '@/components/ui/button';
import { RouteConfig } from '@/config/route-config';
import CollectionTableFilters from '@/features/collections/components/collection-table/collection-table-filters';
import { collectionColumns } from '@/features/collections/components/collection-table/columns';
import type { Collection } from '@/features/collections/schemas/catalog/collection';
import {
  useBulkDeleteCollectionsMutation,
  useDeleteCollectionMutation,
} from '@/features/collections/services/collection';
import { collectionListOptions } from '@/features/collections/types';
import { useConfirmDelete, useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import type { ListingTableProps } from '@/types/pages/common';
import { __ } from '@/wpi18n';

const collectionBulkActions: DataTableBulkAction[] = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce'), destructive: true },
];

const CollectionTable = ({ data, isLoading = false }: ListingTableProps<Collection>) => {
  const navigate = useNavigate();
  const {
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    clearFilters,
  } = useDataTableParams(collectionListOptions);

  const deleteMutation = useDeleteCollectionMutation();
  const bulkDeleteMutation = useBulkDeleteCollectionsMutation();
  const { confirmDelete, confirmDeleteAsync, deleteConfirmation } = useConfirmDelete();

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      if (
        !(await confirmDeleteAsync({
          title: __('Delete selected collections?', 'kirki-ecommerce'),
          description: __(
            'The selected collections will be permanently deleted. The products in them are not deleted. This cannot be undone.',
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

  const handleRowClick = useCallback(
    (item: Collection) => {
      void navigate(RouteConfig.Collections.get('CollectionDetail').buildLink({ id: item.id }));
    },
    [navigate],
  );

  const columns = useMemo<ColumnDef<Collection>[]>(
    () => [
      ...collectionColumns,
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: actionsColumnMeta,
        cell: ({ row }) => (
          <DataTableRowActions
            edit={{ onClick: () => handleRowClick(row.original) }}
            actions={[
              {
                label: __('Delete', 'kirki-ecommerce'),
                icon: <Trash2 size={16} />,
                destructive: true,
                onClick: () =>
                  confirmDelete(
                    {
                      title: __('Delete collection?', 'kirki-ecommerce'),
                      description: __(
                        'This collection will be permanently deleted. The products in it are not deleted. This cannot be undone.',
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
    [confirmDelete, deleteMutation, handleRowClick],
  );

  return (
    <>
      <DataTable
        tableId="collections"
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
        bulkActions={collectionBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        onRowClick={handleRowClick}
        toolbar={<CollectionTableFilters />}
        emptyState={
          <DataTableEmptyState
            title={__('No collections found', 'kirki-ecommerce')}
            actions={
              <Button variant="secondary" onClick={clearFilters}>
                {__('Clear Search', 'kirki-ecommerce')}
              </Button>
            }
          />
        }
      />
      {deleteConfirmation}
    </>
  );
};

CollectionTable.displayName = 'CollectionTable';

export default CollectionTable;
