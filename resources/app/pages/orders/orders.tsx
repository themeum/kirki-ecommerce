import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import PageHeading from '@/molecules/page-heading';

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
            <Button type="ghost" size="small" text="Import" />
            <Button type="ghost" size="small" text="Export" />
            <Button type="primary" size="small" text="Add Order" />
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
