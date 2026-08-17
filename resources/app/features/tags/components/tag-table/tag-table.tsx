import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import TagAddEditDialog from '@/features/tags/components/tag-add-edit-dialog';
import { tagColumns } from '@/features/tags/components/tag-table/columns';
import TagTableFilters from '@/features/tags/components/tag-table/tag-table-filters';
import type { Tag } from '@/features/tags/schemas/catalog/tag';
import { useBulkDeleteTagsMutation, useDeleteTagMutation, useTagsQuery } from '@/features/tags/services/tag';
import { tagListOptions } from '@/features/tags/types';
import { useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { __ } from '@/wpi18n';

const tagBulkActions = [{ value: 'delete', title: __('Trash', 'kirki-ecommerce') }];

const TagTable = () => {
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(tagListOptions);

  const { data, isFetching } = useTagsQuery(params);
  const deleteMutation = useDeleteTagMutation();
  const bulkDeleteMutation = useBulkDeleteTagsMutation();
  const [editingItem, setEditingItem] = useState<Tag | null>(null);

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      await bulkDeleteMutation.mutateAsync(resolveBulkDeletePayload(isAllMatchingSelected, selectedIds));
    },
    [bulkDeleteMutation],
  );

  const columns = useMemo<ColumnDef<Tag>[]>(
    () => [
      ...tagColumns,
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
        pageCount={data?.last_page ?? 0}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
        sorting={sorting}
        onSortingChange={onSortingChange}
        isLoading={isFetching}
        enableRowSelection
        selectionResetKey={selectionResetKey}
        bulkActionOptions={tagBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        toolbar={<TagTableFilters />}
      />
      {editingItem && (
        <TagAddEditDialog key={editingItem.id} tag={editingItem} open onClose={() => setEditingItem(null)} />
      )}
    </>
  );
};

TagTable.displayName = 'TagTable';

export default TagTable;
