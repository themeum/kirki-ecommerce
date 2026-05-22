import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import PageHeading from '@/molecules/page-heading';
import React from "react";
import OrderTable from './order-table/order-table';
import TableInfo from "./order-table/table-info";
import OrderTableAction from "./order-table/order-table-action";

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
        <Card type="form" style={{ marginBottom: "8px" }}>
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
