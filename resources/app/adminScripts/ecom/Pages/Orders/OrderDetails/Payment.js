import { ActionGroup, Badge, Button, Card, Flex, Text } from "molecules";
import React from "react";

const Payment = () => {
  return (
    <Flex direction="column" gap={16}>
      <Flex style={{ justifyContent: "space-between" }}>
        <Text header="Payment" type="primary" />
        <Badge type="pending" text="UNPAID" />
      </Flex>
      <Card type="inner" style={{ borderStyle: "dashed" }}>
        <Flex direction="column" gap={4}>
          <Flex style={{ justifyContent: "space-between" }}>
            <span>Items</span>
            <span>$900</span>
          </Flex>
          <Flex style={{ justifyContent: "space-between" }}>
            <span>Shipping </span>
            <span>$100</span>
          </Flex>
          <Flex style={{ justifyContent: "space-between" }}>
            <span>Tax</span>
            <span>$10</span>
          </Flex>
          <Flex style={{ justifyContent: "space-between" }}>
            <span>Total</span>
            <span>$1200</span>
          </Flex>
        </Flex>
      </Card>
      <ActionGroup>
        <Button type="outlined" text="Send invoice" />
        <Button type="secondary" text="Mark as read" />
      </ActionGroup>
    </Flex>
  );
};

export default Payment;
