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
import { customerColumns } from '@/features/customers/components/customer-table/columns';
import CustomerTableFilters from '@/features/customers/components/customer-table/customer-table-filters';
import type { CustomerListItem } from '@/features/customers/schemas/catalog/customer';
import {
  useBulkDeleteCustomersMutation,
  useDeleteCustomerMutation,
} from '@/features/customers/services/customer';
import type { CustomerListFilter } from '@/features/customers/types';
import { customerListOptions } from '@/features/customers/types';
import { useConfirmDelete, useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import type { ListingTableProps } from '@/types/pages/common';
import { __ } from '@/wpi18n';

const customerBulkActions: DataTableBulkAction[] = [
  { value: 'delete', title: __('Delete Permanently', 'kirki-ecommerce'), destructive: true },
];

const CustomerTable = ({ data, isLoading = false }: ListingTableProps<CustomerListItem>) => {
  const navigate = useNavigate();
  const {
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    clearFilters,
  } = useDataTableParams<CustomerListFilter>(customerListOptions);

  const deleteMutation = useDeleteCustomerMutation();
  const bulkDeleteMutation = useBulkDeleteCustomersMutation();
  const { confirmDelete, confirmDeleteAsync, deleteConfirmation } = useConfirmDelete();

  const handleBulkApply = useCallback(
    async (action: string, { selectedIds, isAllMatchingSelected }: DataTableSelectionState) => {
      if (action !== 'delete') {
        return;
      }

      if (
        !(await confirmDeleteAsync({
          title: __('Delete selected customers?', 'kirki-ecommerce'),
          description: __(
            'The selected customers will be deleted permanently. This cannot be undone.',
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
    (item: CustomerListItem) => {
      void navigate(RouteConfig.Customers.get('CustomerDetail').buildLink({ id: item.id }));
    },
    [navigate],
  );

  const columns = useMemo<ColumnDef<CustomerListItem>[]>(
    () => [
      ...customerColumns,
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        meta: actionsColumnMeta,
        cell: ({ row }) => (
          <div role="presentation" onClick={(event) => event.stopPropagation()}>
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
                        title: __('Delete customer?', 'kirki-ecommerce'),
                        description: __(
                          'This customer will be permanently deleted. This cannot be undone.',
                          'kirki-ecommerce',
                        ),
                      },
                      () => deleteMutation.mutate(row.original.id),
                    ),
                },
              ]}
            />
          </div>
        ),
      },
    ],
    [confirmDelete, deleteMutation, handleRowClick],
  );

  return (
    <>
      <DataTable
        tableId="customers"
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
        bulkActions={customerBulkActions}
        onBulkApply={handleBulkApply}
        columnPinning={{ right: ['actions'] }}
        onRowClick={handleRowClick}
        toolbar={<CustomerTableFilters />}
        emptyState={
          <DataTableEmptyState
            title={__('No customers found', 'kirki-ecommerce')}
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

CustomerTable.displayName = 'CustomerTable';

export default CustomerTable;
