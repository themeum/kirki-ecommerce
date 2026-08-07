import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';

import { NEW_ITEM_ID } from '@/conf';
import { endpoints } from '@/libs/endpoints';
import OrderTable from '@/pages/orders/order-table/order-table';
import OrderTableAction from '@/pages/orders/order-table/order-table-action';
import TableInfo from '@/pages/orders/order-table/table-info';
import { __ } from '@/wpi18n';
import { useNavigate } from 'react-router';

const Orders = () => {
  const navigate = useNavigate();
  return (
    <>
      <PageHeading
        text={__('Orders', 'kirki-ecommerce')}
        actions={
          <>
            <Button variant="ghost">
              {__('Import', 'kirki-ecommerce')}
            </Button>
            <Button variant="ghost">
              {__('Export', 'kirki-ecommerce')}
            </Button>
            <Button variant="primary" onClick={() => navigate(endpoints.ORDER(NEW_ITEM_ID))}>
              {__('Add Order', 'kirki-ecommerce')}
            </Button>
          </>
        }
      />
      <Container>
        <Card cssOverride={mergeCss(cardStyles.formCard, styles.tableInfoCard)}>
          <CardContent>
            <TableInfo />
          </CardContent>
        </Card>
        <Card cssOverride={cardStyles.tableCard}>
          <CardContent cssOverride={cardStyles.tableContent}>
            <OrderTableAction />
            <OrderTable />
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default Orders;

const styles = defineStyles({
  tableInfoCard: {
    marginBottom: theme.spacing[2],
  },
});
