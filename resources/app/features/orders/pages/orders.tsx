import { useNavigate } from 'react-router';

import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { RouteConfig } from '@/config/route-config';
import OrderTable from '@/features/orders/components/order-table/order-table';
import { __ } from '@/wpi18n';

const Orders = () => {
  const navigate = useNavigate();
  return (
    <>
      <PageHeading
        text={__('Orders', 'kirki-ecommerce')}
        actions={
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
        }
      />
      <Container>
        {/* @todo: implement table info later */}
        {/* <Card cssOverride={mergeCss(cardStyles.formCard, styles.tableInfoCard)}>
          <CardContent>
            <TableInfo />
          </CardContent>
        </Card> */}
        <OrderTable />
      </Container>
    </>
  );
};

export default Orders;

// const styles = defineStyles({
//   tableInfoCard: {
//     marginBottom: theme.spacing[2],
//   },
// });
