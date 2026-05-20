import React from "react";
import { Card, Flex } from "../../../../molecules";
import { BoxOpenIcon } from "icons";
import HeaderActionsCard from "../../../../components/HeaderActionsCard";
import GroupOptionCard from "../../../../components/GroupOptionCard";
import { __ } from "wpi18n";

const ShippingCareer = (props) => {
  const hasShippingCareers = false;
  // const { handleDeleteItem, handleEditItem, handleToggleItem } = props;
  return (
    <div>
      <Card type="large">
        <HeaderActionsCard
          header={__("Shipping Careers", "kirki-ecommerce")}
          subHeader={__(
            "Used to create shipping rates for different product groups, like heavy items needing higher fees.",
            "kirki-ecommerce"
          )}
          buttonText={__("Add Career", "kirki-ecommerce")}
          onAdd={() => console.log("")}
        />

        {!hasShippingCareers ? (
          <Card type="innerDark" style={{ padding: "36px 0" }}>
            <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
              <BoxOpenIcon />
              <span style={{ color: "#878593" }}>
                {__("Added shipping profiles will appear here", "kirki-ecommerce")}
              </span>
            </Flex>
          </Card>
        ) : (
          <GroupOptionCard
          // dataArr={shippingCareersData}
          // handleToggleItem={handleToggleItem}
          // handleDeleteItem={handleDeleteItem}
          // handleEditItem={handleEditItem}
          />
        )}
      </Card>
    </div>
  );
};

export default ShippingCareer;
