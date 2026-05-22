import React from "react";
import {
  Card,
  Flex,
  Text,
  ActionGroup,
  ToggleButton,
} from "../../../molecules";
import OptionAccordion from "../../../components/OptionAccordion";
import GroupOptionCard from "../../../components/GroupOptionCard";
import { PersonIcon, CartIcon, UserIcon } from "@/Icons";
import { mapEmailGroup } from "./utils";
import { __ } from "@/wpi18n";

const CustomerEmail = (props) => {
  const { customerEmails, handleToggleOrder, handleEditOrder } = props;

  const { orderEmails, userEmails } = React.useMemo(() => {
    if (!customerEmails) {
      return {
        orderEmails: [],
        userEmails: [],
      };
    }

    return {
      orderEmails: mapEmailGroup(
        customerEmails.order_notifications,
        "customer_order"
      ),

      userEmails: mapEmailGroup(
        customerEmails.user_notifications,
        "customer_user"
      ),
    };
  }, [customerEmails]);
  return (
    <div>
      <Card style={{ borderRadius: "12px" }}>
        <Flex direction="column" gap={16}>
          <Flex direction="column" style={{ alignItems: "flex-start" }} gap={6}>
            <Text
              header={__("Customer Emails", "kirki-ecommerce")}
              type="primary"
              style={{ gap: "6px" }}
              leftIcon={<PersonIcon />}
            />
            <Text subHeader={__("Manage customer emails here", "kirki-ecommerce")} />
          </Flex>

          <OptionAccordion
            header={__("Order", "kirki-ecommerce")}
            subHeader={__("Customers get updates about their orders.", "kirki-ecommerce")}
            leftIcon={<CartIcon />}
          >
            <GroupOptionCard
              handleToggleItem={handleToggleOrder}
              handleEditItem={handleEditOrder}
              dataArr={orderEmails}
            />
          </OptionAccordion>
          <OptionAccordion
            header={__("User", "kirki-ecommerce")}
            subHeader={__(
              "Customers get updates regarding registration.",
              "kirki-ecommerce"
            )}
            leftIcon={<UserIcon />}
            // rightActions={
            //   <ActionGroup gap={8} style={{ alignItems: "center" }}>
            //     <ToggleButton value={true} />
            //   </ActionGroup>
            // }
          >
            <GroupOptionCard
              dataArr={userEmails}
              handleToggleItem={handleToggleOrder}
              handleEditItem={handleEditOrder}
            />
          </OptionAccordion>
        </Flex>
      </Card>
    </div>
  );
};

export default CustomerEmail;
