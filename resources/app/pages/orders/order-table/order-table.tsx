import { format } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';

import DataTable, { type DataTableColumn } from '@/components/data-table';
import Badge from '@/components/ui/badge';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import type { OrderListFilter} from '@/features/orders';
import { orderListOptions } from '@/features/orders';
import { useListParams } from '@/hooks';
import { DATE_FORMATS } from '@/libs/date';
import { getFulfillmentBadgeInfo, getPaymentBadgeInfo } from '@/pages/orders/order-details/config/order-badge';
import FilterPopup from '@/pages/orders/order-table/filter-popup/filter-popup';
import OrderTableAction from '@/pages/orders/order-table/order-table-action';
import OrderTableFilterBar from '@/pages/orders/order-table/order-table-filter-bar';
import type { OrderListItem } from '@/schemas/catalog/order';
import { useOrdersQuery } from '@/services/order';
import { __, sprintf } from '@/wpi18n';

const OrderCell = ({ item }: { item: OrderListItem }) => {
  const customerLabel = item.customer_name || item.customer_email;

  return (
    <Flex
      direction="column"
      gap={1}
    >
      <Flex gap={1} align="center" >
        <Text variant="tiny" color="subdued">{`#${item.order_number || item.id}`}</Text>
        {item.is_manual ? (
          <Badge variant="secondary">{__('Manual Order', 'kirki-ecommerce')}</Badge>
        ) : null}
      </Flex>
      {customerLabel ? (
        <Text variant="tiny">
          {
            /* translators: %s: customer name */
            sprintf(__('by %s', 'kirki-ecommerce'), customerLabel)
          }
        </Text>
      ) : null}
    </Flex>
  );
};

OrderCell.displayName = 'OrderCell';

const OrderTable = () => {
  const navigate = useNavigate();
  const { params, setParam } = useListParams<OrderListFilter>(orderListOptions);

  const { data, isLoading } = useOrdersQuery(params);

  const handlePaginationChange = useCallback(
    (value: number) => {
      setParam('page', value);
    },
    [setParam],
  );

  const orderColumns: DataTableColumn<OrderListItem>[] = useMemo(() => {
    return [
      {
        title: __('Order', 'kirki-ecommerce'),
        renderItem: (item) => <OrderCell item={item} />,
        cssOverride: { width: '10%' },
      },
      {
        title: __('Quantity', 'kirki-ecommerce'),
        renderItem: (item) => <Text variant="small">{item.quantity}</Text>,
        alignment: 'center',
      },
      {
        title: __('Price', 'kirki-ecommerce'),
        renderItem: (item) => <Text variant="small">{item.invoiced_total_money_object.display}</Text>,
        alignment: 'center',
      },
      {
        title: __('Status', 'kirki-ecommerce'),
        renderItem: (item) => {
          const fulfillmentBadge = getFulfillmentBadgeInfo(item.fulfillment_status);
          const paymentBadge = getPaymentBadgeInfo(item.payment_status);
          return (
            <Flex gap={1} align="center"><Badge variant={paymentBadge.variant}>
              <Text variant="tiny">{paymentBadge.text}</Text>
            </Badge>
              <Badge variant={fulfillmentBadge.variant}>
                <Text variant="tiny">{fulfillmentBadge.text}</Text>
              </Badge>
            </Flex>
          );
        },
        alignment: 'center',
      },
      {
        title: __('Payment', 'kirki-ecommerce'),
        renderItem: (item) => {

          return item.payment_provider ? (
            <Text variant="tiny" color="subdued">{item.payment_provider.toUpperCase()}</Text>
          ) : null;
        },
        alignment: 'center',
      },
      {
        title: __('Date', 'kirki-ecommerce'),
        renderItem: (item) =>
          item.created_at ? format(new Date(item.created_at), DATE_FORMATS.HUMAN_READABLE) : '-',
        alignment: 'center',
      },
    ];
  }, [])

  return (
    <DataTable
      data={data}
      isLoading={isLoading}
      columns={orderColumns}
      onPageChange={handlePaginationChange}
      onRowClick={(item) => {
        void navigate(RouteConfig.Orders.get('OrderDetail').buildLink({ id: item.id }));
      }}
    >
      <DataTable.Filter>
        <OrderTableAction />
      </DataTable.Filter>
      <DataTable.SelectionFilter>
        <FilterPopup />
      </DataTable.SelectionFilter>
      <DataTable.FilterBar>
        <OrderTableFilterBar />
      </DataTable.FilterBar>
      <DataTable.Pagination />
    </DataTable>
  );
};

OrderTable.displayName = 'OrderTable';

export default OrderTable;

