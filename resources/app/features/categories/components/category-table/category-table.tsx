import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import CategoryAddEditPopover from '@/features/categories/components/category-add-edit-dialog';
import CategoryTableFilters from '@/features/categories/components/category-table/category-table-filters';
import { categoryColumns } from '@/features/categories/components/category-table/columns';
import type { Category } from '@/features/categories/schemas/catalog/category';
import { useBulkDeleteCategoriesMutation, useCategoriesQuery, useDeleteCategoryMutation } from '@/features/categories/services/category';
import { categoryListOptions } from '@/features/categories/types';
import { useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { __ } from '@/wpi18n';

const categoryBulkActions = [{ value: 'delete', title: __('Trash', 'kirki-ecommerce') }];

const CategoryTable = () => {
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(categoryListOptions);

  const { data, isFetching } = useCategoriesQuery(params);
  const deleteMutation = useDeleteCategoryMutation();
  const bulkDeleteMutation = useBulkDeleteCategoriesMutation();
  const [editingItem, setEditingItem] = useState<Category | null>(null);

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      await bulkDeleteMutation.mutateAsync(resolveBulkDeletePayload(isAllMatchingSelected, selectedIds));
    },
    [bulkDeleteMutation],
  );

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      ...categoryColumns,
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
        bulkActionOptions={categoryBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        density="compact"
        toolbar={<CategoryTableFilters />}
      />
      {editingItem && (
        <CategoryAddEditPopover key={editingItem.id} category={editingItem} onClose={() => setEditingItem(null)} />
      )}
    </>
  );
};

CategoryTable.displayName = 'CategoryTable';

export default CategoryTable;
