import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { DataTableBulkAction, DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import { actionsColumnMeta } from '@/components/data-table/column-styles';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import CategoryAddEditPopover from '@/features/categories/components/category-add-edit-dialog';
import CategoryTableFilters from '@/features/categories/components/category-table/category-table-filters';
import { createCategoryColumns } from '@/features/categories/components/category-table/columns';
import type { Category } from '@/features/categories/schemas/catalog/category';
import {
  useBulkDeleteCategoriesMutation,
  useCategoriesQuery,
  useDeleteCategoryMutation,
} from '@/features/categories/services/category';
import { categoryListOptions } from '@/features/categories/types';
import { useConfirmDelete, useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { __ } from '@/wpi18n';

const categoryBulkActions: DataTableBulkAction[] = [
  { value: 'delete', title: __('Trash', 'kirki-ecommerce'), destructive: true },
];

const CategoryTable = () => {
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(categoryListOptions);

  const { data, isFetching } = useCategoriesQuery(params);
  const deleteMutation = useDeleteCategoryMutation();
  const bulkDeleteMutation = useBulkDeleteCategoriesMutation();
  const { confirmDelete, confirmDeleteAsync, deleteConfirmation } = useConfirmDelete();
  const [editingItem, setEditingItem] = useState<Category | null>(null);

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      if (
        !(await confirmDeleteAsync({
          title: __('Delete selected categories?', 'kirki-ecommerce'),
          description: __(
            'The selected categories will be permanently deleted. This cannot be undone.',
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

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      ...createCategoryColumns({ onEdit: setEditingItem }),
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
                      title: __('Delete category?', 'kirki-ecommerce'),
                      description: __(
                        'This category will be permanently deleted. This cannot be undone.',
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
        tableId="categories"
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
        bulkActions={categoryBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        density="compact"
        toolbar={<CategoryTableFilters />}
      />
      {deleteConfirmation}
      {editingItem && (
        <CategoryAddEditPopover
          key={editingItem.id}
          category={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </>
  );
};

CategoryTable.displayName = 'CategoryTable';

export default CategoryTable;
