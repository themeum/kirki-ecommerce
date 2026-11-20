import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import { RouteConfig } from '@/config/route-config';
import { orderListOptions } from '@/features/orders';
import OrderTable from '@/features/orders/components/order-table/order-table';
import { useOrdersQuery } from '@/features/orders/services/order';
import { useDataTableParams } from '@/hooks';
import { OrderEmptyStateIcon } from '@/icons/empty-state';
import { isDefined } from '@/utils/object';
import { __ } from '@/wpi18n';

const Orders = () => {
  const navigate = useNavigate();
  const { params } = useDataTableParams(orderListOptions);

  const { data, isFetching, isError, refetch, isFetched } = useOrdersQuery(params);

  const showNoRecordState =
    isFetched && isDefined(data) && isDefined(data.has_records) && !data.has_records;

  return (
    <Page>
      <PageHeading
        text={__('Orders', 'kirki-ecommerce')}
        actions={
          !isFetching &&
          !showNoRecordState && (
            <>
              {/* @todo: implement import and export later */}
              {/* <Button variant="ghost">
              {__('Import', 'kirki-ecommerce')}
            </Button>
            <Button variant="ghost">
              {__('Export', 'kirki-ecommerce')}
            </Button> */}
              <Button
                variant="primary"
                onClick={() => navigate(RouteConfig.Orders.get('CreateOrder').buildLink())}
              >
                {__('Add Order', 'kirki-ecommerce')}
              </Button>
            </>
          )
        }
      />
      <PageContent>
        {isError ? (
          <QueryErrorState onRetry={() => void refetch()} isRetrying={isFetching} />
        ) : showNoRecordState ? (
          <NotFoundState
            icon={<OrderEmptyStateIcon />}
            text={__('No orders yet', 'kirki-ecommerce')}
            description={__(
              `Waiting on that first cha-ching! As soon as an order rolls in, you'll manage the fulfillment right here.`,
              'kirki-ecommerce',
            )}
            actions={
              <Button
                variant="primary"
                onClick={() => {
                  void navigate(RouteConfig.Orders.get('CreateOrder').buildLink());
                }}
              >
                {__('Create Order', 'kirki-ecommerce')}
              </Button>
            }
          />
        ) : (
          <OrderTable data={data} isLoading={isFetching} />
        )}
      </PageContent>
    </Page>
  );
};

export default Orders;
