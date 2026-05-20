import { Button, Card, Container, PageHeading } from "molecules";
import React from "react";
import OrderTable from "./OrderTable";
import TableInfo from "./OrderTable/TableInfo";
import OrderTableAction from "./OrderTable/OrderTableAction";

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
