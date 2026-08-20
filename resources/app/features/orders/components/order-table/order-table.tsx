import { useNavigate } from 'react-router';

import DataTable from '@/components/data-table';
import { RouteConfig } from '@/config/route-config';
import type { OrderListFilter } from '@/features/orders';
import { orderListOptions } from '@/features/orders';
import { orderColumns } from '@/features/orders/components/order-table/columns';
import OrderTableAction from '@/features/orders/components/order-table/order-table-action';
import OrderTableFilterBar from '@/features/orders/components/order-table/order-table-filter-bar';
import { useOrdersQuery } from '@/features/orders/services/order';
import { useDataTableParams } from '@/hooks';

const OrderTable = () => {
  const navigate = useNavigate();
  const { params, pagination, sorting, onPaginationChange, onSortingChange, selectionResetKey } =
    useDataTableParams<OrderListFilter>(orderListOptions);

  const { data, isFetching } = useOrdersQuery(params);

  return (
    <DataTable
      data={data?.results ?? []}
      columns={orderColumns}
      pageCount={data?.last_page ?? 0}
      pagination={pagination}
      onPaginationChange={onPaginationChange}
      sorting={sorting}
      onSortingChange={onSortingChange}
      isLoading={isFetching}
      enableRowSelection
      selectionResetKey={selectionResetKey}
      onRowClick={(item) => {
        void navigate(RouteConfig.Orders.get('OrderDetail').buildLink({ id: item.id }));
      }}
      toolbar={<OrderTableAction />}
      filterBar={<OrderTableFilterBar />}
    />
  );
};

OrderTable.displayName = 'OrderTable';

export default OrderTable;
