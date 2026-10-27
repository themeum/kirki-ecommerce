import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { DataTableBulkAction, DataTableSelectionState } from '@/components/data-table';
import DataTable, { DataTableEmptyState } from '@/components/data-table';
import { actionsColumnMeta } from '@/components/data-table/column-styles';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import Button from '@/components/ui/button';
import TagAddEditDialog from '@/features/tags/components/tag-add-edit-dialog';
import { createTagColumns } from '@/features/tags/components/tag-table/columns';
import TagTableFilters from '@/features/tags/components/tag-table/tag-table-filters';
import type { Tag } from '@/features/tags/schemas/catalog/tag';
import { useBulkDeleteTagsMutation, useDeleteTagMutation } from '@/features/tags/services/tag';
import { tagListOptions } from '@/features/tags/types';
import { useConfirmDelete, useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import type { ListingTableProps } from '@/types/pages/common';
import { __ } from '@/wpi18n';

const tagBulkActions: DataTableBulkAction[] = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce'), destructive: true },
];

const TagTable = ({ data, isLoading = false }: ListingTableProps<Tag>) => {
  const {
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    clearFilters,
  } = useDataTableParams(tagListOptions);

  const deleteMutation = useDeleteTagMutation();
  const bulkDeleteMutation = useBulkDeleteTagsMutation();
  const { confirmDelete, confirmDeleteAsync, deleteConfirmation } = useConfirmDelete();
  const [editingItem, setEditingItem] = useState<Tag | null>(null);

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      if (
        !(await confirmDeleteAsync({
          title: __('Delete selected tags?', 'kirki-ecommerce'),
          description: __(
            'The selected tags will be permanently deleted. This cannot be undone.',
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

  const columns = useMemo<ColumnDef<Tag>[]>(
    () => [
      ...createTagColumns({ onEdit: setEditingItem }),
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
                      title: __('Delete tag?', 'kirki-ecommerce'),
                      description: __(
                        'This tag will be permanently deleted. This cannot be undone.',
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
        tableId="tags"
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
        bulkActions={tagBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        toolbar={<TagTableFilters />}
        emptyState={
          <DataTableEmptyState
            title={__('No tags found', 'kirki-ecommerce')}
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
        <TagAddEditDialog
          key={editingItem.id}
          tag={editingItem}
          open
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  );
};

TagTable.displayName = 'TagTable';

export default TagTable;
