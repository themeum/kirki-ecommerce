import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import NotFoundState from '@/components/ui/not-found-state';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import { RouteConfig } from '@/config/route-config';
import { orderListOptions } from '@/features/orders';
import OrderTable from '@/features/orders/components/order-table/order-table';
import { useOrdersQuery } from '@/features/orders/services/order';
import { useDataTableParams } from '@/hooks';
import { OrderEmptyStateIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

const Orders = () => {
  const navigate = useNavigate();
  const { params } = useDataTableParams(orderListOptions);

  const { data, isFetching } = useOrdersQuery(params);

  const hasRecord = data?.has_records !== false;

  return (
    <Page>
      <PageHeading
        text={__('Orders', 'kirki-ecommerce')}
        actions={
          hasRecord && (
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
        {!hasRecord ? (
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
