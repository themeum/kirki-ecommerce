import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import { RouteConfig } from '@/config/route-config';
import CollectionTableFilters from '@/features/collections/components/collection-table/collection-table-filters';
import { collectionColumns } from '@/features/collections/components/collection-table/columns';
import type { Collection } from '@/features/collections/schemas/catalog/collection';
import { useBulkDeleteCollectionsMutation, useCollectionsQuery, useDeleteCollectionMutation } from '@/features/collections/services/collection';
import { collectionListOptions } from '@/features/collections/types';
import { useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { __ } from '@/wpi18n';

const collectionBulkActions = [{ value: 'delete', title: __('Trash', 'kirki-ecommerce') }];

const CollectionTable = () => {
  const navigate = useNavigate();
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(collectionListOptions);

  const { data, isFetching } = useCollectionsQuery(params);
  const deleteMutation = useDeleteCollectionMutation();
  const bulkDeleteMutation = useBulkDeleteCollectionsMutation();

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      await bulkDeleteMutation.mutateAsync(resolveBulkDeletePayload(isAllMatchingSelected, selectedIds));
    },
    [bulkDeleteMutation],
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
        cell: ({ row }) => (
          <div role="presentation" onClick={(event) => event.stopPropagation()}>
            <DataTableRowActions
              edit={{ onClick: () => handleRowClick(row.original) }}
              actions={[
                {
                  label: __('Delete', 'kirki-ecommerce'),
                  icon: <Trash2 size={16} />,
                  destructive: true,
                  onClick: () => deleteMutation.mutate(row.original.id),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [deleteMutation, handleRowClick],
  );

  return (
    <DataTable
      data={data?.results ?? []}
      columns={columns}
      pageCount={data?.last_page ?? 0}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={isFetching}
      enableRowSelection
      selectionResetKey={selectionResetKey}
      bulkActionOptions={collectionBulkActions}
      onBulkApply={handleBulkApply}
      columnPinning={{ right: ['actions'] }}
      fixed
      onRowClick={handleRowClick}
      toolbar={<CollectionTableFilters />}
    />
  );
};

CollectionTable.displayName = 'CollectionTable';

export default CollectionTable;
