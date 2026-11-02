import { useNavigate } from 'react-router';

import DataTable, { DataTableEmptyState } from '@/components/data-table';
import Button from '@/components/ui/button';
import { RouteConfig } from '@/config/route-config';
import type { OrderListFilter } from '@/features/orders';
import { orderListOptions } from '@/features/orders';
import { orderColumns } from '@/features/orders/components/order-table/columns';
import OrderTableAction from '@/features/orders/components/order-table/order-table-action';
import type { OrderListItem } from '@/features/orders/schemas/catalog/order';
import { useDataTableParams } from '@/hooks';
import type { ListingTableProps } from '@/types/pages/common';
import { __ } from '@/wpi18n';

const OrderTable = ({ data, isLoading = false }: ListingTableProps<OrderListItem>) => {
  const navigate = useNavigate();
  const {
    pagination,
    sorting,
    onPaginationChange,
    onSortingChange,
    selectionResetKey,
    clearFilters,
  } = useDataTableParams<OrderListFilter>(orderListOptions);

  return (
    <DataTable
      tableId="orders"
      data={data?.results ?? []}
      columns={orderColumns}
      total={data?.total}
      pageCount={data?.last_page ?? 0}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={isLoading}
      enableRowSelection
      selectionResetKey={selectionResetKey}
      onRowClick={(item) => {
        void navigate(RouteConfig.Orders.get('OrderDetail').buildLink({ id: item.id }));
      }}
      toolbar={<OrderTableAction />}
      emptyState={
        <DataTableEmptyState
          title={__('No orders found', 'kirki-ecommerce')}
          actions={
            <Button variant="secondary" onClick={clearFilters}>
              {__('Clear Search', 'kirki-ecommerce')}
            </Button>
          }
        />
      }
    />
  );
};

OrderTable.displayName = 'OrderTable';

export default OrderTable;
