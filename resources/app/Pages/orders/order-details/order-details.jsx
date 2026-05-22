import { FlagIcon, PlusIcon, ShowMoreIcon } from "@/icons";
import Alert from '@/molecules/alert';
import Badge from '@/molecules/badge';
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Label from '@/molecules/label';
import PageHeading from '@/molecules/page-heading';
import Select from '@/molecules/select/select';
import Text from '@/molecules/text';
import React from "react";
import ItemsTable from './items-table';
import Payment from './payment';
import CustomerInfo from './customer-info';

const OrderDetails = () => {
  const optionsArray = [
    { value: "paid", title: "Paid" },
    { value: "unpaid", title: "Unpaid" },
    { value: "pending", title: "Pending" },
  ];
  return (
    <>
      <PageHeading
        text="Order #21132"
        type="primary"
        actions={
          <>
            <Button type="ghost" size="small" icon={<ShowMoreIcon />} />
            <Button type="ghost" size="small" text="Cancel Order" />
            <Button type="primary" size="small" text="Update" />
          </>
        }
        hasBack
        sticky
      >
        <Badge text="Pending" type="pending" />
      </PageHeading>
      <Container>
        <Flex gap={16}>
          <Flex direction="column" gap={16} style={{ width: "70%" }}>
            <Card type="form">
              <Text header="Items(4)" type="primary" padding="large" />
              <Card type="inner" style={{ padding: "0" }}>
                <ItemsTable />
              </Card>
            </Card>

            <Card type="form">
              <Payment />
            </Card>

            <Card type="form">
              <Text header="Timeline" type="primary" padding="large" />
              This is timeline section
            </Card>
          </Flex>

          <Flex direction="column" gap={16} style={{ width: "30%" }}>
            <Alert
              hasHighlight
              icon={<FlagIcon />}
              text="Manually created by the Admin."
            />

            <Card type="form">
              <Select
                value="pending"
                label="Order Status"
                optionsArray={optionsArray}
              />
              <Select
                value="unpaid"
                label="Payment Status"
                optionsArray={optionsArray}
              />
            </Card>

            <CustomerInfo />

            <Card type="form">
              <Input
                label="Flag"
                placeholder="i.e Backorder, Urgent"
                value="skjl"
              />
            </Card>

            <Card type="form">
              <Label text="Notes" />
              <Button
                type="secondary"
                text="Add note"
                leftIcon={<PlusIcon />}
                style={{ width: "100%" }}
              />
            </Card>
          </Flex>
        </Flex>
      </Container>
    </>
  );
};

export default OrderDetails;
