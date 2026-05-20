import React from "react";
import { Card, Flex, Text, ActionGroup, Button } from "../../../molecules";
import { PlusIcon } from "icons";
import { __ } from "wpi18n";

const SellerTaxID = () => {
  return (
    <div>
      <Card type="large">
        <Flex direction="column" gap={6}>
          <Flex style={{ alignItems: "center" }}>
            <Text
              type="primary"
              header={__("Seller Tax ID", "kirki-ecommerce")}
              style={{ gap: "12px" }}
            />
            <ActionGroup>
              <Button
                text="Add ID"
                type="secondary"
                size="small"
                leftIcon={<PlusIcon />}
              />
            </ActionGroup>
          </Flex>
          <Text
            type="primary"
            subHeader={__(
              "This information will be used on invoices where tax is applied, based on buyer region and your registration scope.",
              "kirki-ecommerce"
            )}
          />
        </Flex>
      </Card>
    </div>
  );
};

export default SellerTaxID;
