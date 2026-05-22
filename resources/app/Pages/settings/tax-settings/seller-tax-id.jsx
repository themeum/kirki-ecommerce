import React from "react";
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import ActionGroup from '@/molecules/action-group';
import Button from '@/molecules/button';
import { PlusIcon } from "@/icons";
import { __ } from "@/wpi18n";

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
