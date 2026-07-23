import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

import OrderTable from '@/pages/orders/order-table/order-table';
import OrderTableAction from '@/pages/orders/order-table/order-table-action';
import TableInfo from '@/pages/orders/order-table/table-info';

const Orders = () => {
  return (
    <>
      <PageHeading
        text="Orders"
        actions={
          <>
            <Button variant="ghost" size="sm">
              Import
            </Button>
            <Button variant="ghost" size="sm">
              Export
            </Button>
            <Button variant="primary" size="sm">
              Add Order
            </Button>
          </>
        }
      />
      <Container>
        <Card css={styles.formCard} style={{ marginBottom: '8px' }}>
          <CardContent>
            <TableInfo />
          </CardContent>
        </Card>
        <Card css={styles.tableCard}>
          <CardContent css={styles.tableContent}>
            <OrderTableAction />
            <OrderTable />
          </CardContent>
        </Card>
      </Container>
    </>
  );
};

export default Orders;

const styles = {
  formCard: scoped({
    rowGap: theme.spacing['2xl'],
  }),
  tableCard: scoped({
    overflow: 'hidden',
    border: '1px solid #e6e6e6',
    gap: 0,
    padding: theme.spacing.none,
  }),
  tableContent: scoped({
    padding: theme.spacing.none,
  }),
};
