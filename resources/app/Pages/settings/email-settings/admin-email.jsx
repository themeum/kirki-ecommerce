import React from "react";
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import OptionAccordion from '@/components/option-accordion';
import GroupOptionCard from '@/components/group-option-card';
import { SettingsIcon, CartIcon, InventoryBoxIcon, UserIcon } from "@/icons";
import { mapEmailGroup } from "./utils";
import { __ } from "@/wpi18n";

const AdminEmail = (props) => {
  const { adminEmails, handleToggleOrder, handleEditOrder } = props;

  const { orderEmails, inventoryEmails, userEmails } = React.useMemo(() => {
    if (!adminEmails) {
      return {
        orderEmails: [],
        inventoryEmails: [],
        userEmails: [],
      };
    }

    return {
      orderEmails: mapEmailGroup(
        adminEmails.order_notifications,
        "admin_order"
      ),
      inventoryEmails: mapEmailGroup(
        adminEmails.inventory_notifications,
        "admin_inventory"
      ),
      userEmails: mapEmailGroup(adminEmails.user_notifications, "admin_user"),
    };
  }, [adminEmails]);

  return (
    <>
      <Card style={{ borderRadius: "12px" }}>
        <Flex direction="column" gap={16}>
          <Flex direction="column" style={{ alignItems: "flex-start" }} gap={6}>
            <Text
              header={__("Admin Emails", "kirki-ecommerce")}
              type="primary"
              style={{ gap: "6px" }}
              leftIcon={<SettingsIcon />}
            />
            <Text subHeader={__("Manage admin emails here", "kirki-ecommerce")} />
          </Flex>

          <OptionAccordion
            header={__("Order", "kirki-ecommerce")}
            subHeader={__(
              "Get notified about updates on your customer's orders.",
              "kirki-ecommerce"
            )}
            leftIcon={<CartIcon />}
          >
            <GroupOptionCard
              dataArr={orderEmails}
              handleToggleItem={handleToggleOrder}
              handleEditItem={handleEditOrder}
            />
          </OptionAccordion>
          <OptionAccordion
            header={__("Inventory", "kirki-ecommerce")}
            subHeader={__("Get notified about your inventory status", "kirki-ecommerce")}
            leftIcon={<InventoryBoxIcon />}
          >
            <GroupOptionCard
              dataArr={inventoryEmails}
              handleToggleItem={handleToggleOrder}
              handleEditItem={handleEditOrder}
            />
          </OptionAccordion>
          <OptionAccordion
            header={__("User", "kirki-ecommerce")}
            subHeader={__("Get notified about new user registration", "kirki-ecommerce")}
            leftIcon={<UserIcon />}
          >
            <GroupOptionCard
              dataArr={userEmails}
              handleToggleItem={handleToggleOrder}
              handleEditItem={handleEditOrder}
            />
          </OptionAccordion>
        </Flex>
      </Card>
    </>
  );
};

export default AdminEmail;
