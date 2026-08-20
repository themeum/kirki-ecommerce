import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import type { DataTableSelectionState } from '@/components/data-table';
import DataTable from '@/components/data-table';
import DataTableRowActions from '@/components/data-table/data-table-row-actions';
import { RouteConfig } from '@/config/route-config';
import { customerColumns } from '@/features/customers/components/customer-table/columns';
import CustomerTableFilters from '@/features/customers/components/customer-table/customer-table-filters';
import type { CustomerListItem } from '@/features/customers/schemas/catalog/customer';
import { useBulkDeleteCustomersMutation, useCustomersQuery, useDeleteCustomerMutation } from '@/features/customers/services/customer';
import { customerListOptions } from '@/features/customers/types';
import { useDataTableParams } from '@/hooks';
import { resolveBulkDeletePayload } from '@/libs/bulk-delete';
import { __ } from '@/wpi18n';

const customerBulkActions = [{ value: 'delete', title: __('Trash', 'kirki-ecommerce') }];

const CustomerTable = () => {
  const navigate = useNavigate();
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams(customerListOptions);

  const { data, isFetching } = useCustomersQuery(params);
  const deleteMutation = useDeleteCustomerMutation();
  const bulkDeleteMutation = useBulkDeleteCustomersMutation();

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
      bulkActionOptions={customerBulkActions}
      onBulkApply={handleBulkApply}
      columnPinning={{ right: ['actions'] }}
      onRowClick={handleRowClick}
      toolbar={<CustomerTableFilters />}
    />
  );
};

CustomerTable.displayName = 'CustomerTable';

export default CustomerTable;
