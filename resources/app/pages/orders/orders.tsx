import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Container from '@/components/ui/container';
import PageHeading from '@/components/ui/page-heading';

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
        <Card type="form" style={{ marginBottom: '8px' }}>
          <TableInfo />
        </Card>
        <Card type="table">
          <OrderTableAction />
          <OrderTable />
        </Card>
      </Container>
    </>
  );
};

export default Orders;
