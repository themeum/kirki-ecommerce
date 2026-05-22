import React, { useState } from "react";
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import ActionGroup from '@/molecules/action-group';
import ToggleButton from '@/molecules/toggle-button';
import Badge from '@/molecules/badge';
import { __, sprintf } from "@/wpi18n";
import DropdownButton from '@/components/dropdown-button';
import PaymentGatewayPopup from './payment-gateway-popup';
import { MapIcon, StripeIcon, ShowMoreIcon } from "@/icons";
import {
  getPaymentGatewayById,
  setEnabledPaymentGateway,
} from "../../../store/settingsSlice";
import { dispatchToastMessage } from "../../utils";
import HeaderActionsCard from '@/components/header-actions-card';
import PaymentGatewayEditPopup from './payment-gateway-edit-popup';

const PaymentGateway = (props) => {
  const { paymentGatewayList, setPaymentGatewayList, setIsMethodListUpdated } =
    props;

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editedItem, setEditedItem] = useState(null);
  const [openPopup, setOpenPopup] = useState(false);

  const handleToggleMethod = async (item) => {
    const params = { is_enabled: !item?.is_enabled };
    const result = await setEnabledPaymentGateway(item?.id, params);

    if (result.success) {
      setPaymentGatewayList((prev) =>
        prev.map((method) =>
          method.id === item.id
            ? { ...method, is_enabled: !item?.is_enabled }
            : method
        )
      );

      dispatchToastMessage("success", {
        title: __("Payment gateway updated", "kirki-ecommerce"),
      });
    } else {
      dispatchToastMessage("error", {
        title: __("Something went wrong", "kirki-ecommerce"),
      });
    }
  };

  const handleAction = async (action, item) => {
    if (action === "delete") {
      const initialList = [...paymentGatewayList];
      const updatedPaymentList = paymentGatewayList?.filter(
        (method) => method?.id !== item?.id
      );
      setPaymentGatewayList(updatedPaymentList);
      dispatchToastMessage("delete", {
        title: __("Payment gateway deleted", "kirki-ecommerce"),
        duration: 5000,
        undoAction: () => {
          setPaymentGatewayList(initialList);
        },
        onSuccess: async () => {
          //need to update the api call
          // await deleteP(item.id);
        },
      });
    } else if (action === "edit") {
      const result = await getPaymentGatewayById(item?.id);
      if (result?.success) {
        setEditedItem(result?.data);
        setOpenPopup(true);
      }
    }
  };

  return (
    <>
      <Card type="large">
        <HeaderActionsCard
          header={__("Payment gateways", "kirki-ecommerce")}
          subHeader={__(
            "Set up and manage your online store's payment options.",
            "kirki-ecommerce"
          )}
          buttonText={__("Add Payment Methods", "kirki-ecommerce")}
          onAdd={() => setIsEditPopupOpen(true)}
        />
        {paymentGatewayList?.length === 0 ? (
          <Card type="innerDark" style={{ padding: "36px 0" }}>
            <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
              <MapIcon />
              <span style={{ color: "#878593" }}>
                {__("No payment added yet", "kirki-ecommerce")}
              </span>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" gap={16}>
            {paymentGatewayList?.map((item, index) => (
              <Card
                type="inner"
                key={index}
                style={{
                  padding: "var(--decom-spacing-3) var(--decom-spacing-4)",
                }}
              >
                <Flex style={{ alignItems: "center" }}>
                  <Text
                    header={sprintf(__("%s", "kirki-ecommerce"), item?.name)}
                    leftIcon={<StripeIcon />}
                    badge={
                      !item?.is_enabled && (
                        <Badge text={__("Inactive", "kirki-ecommerce")} type="trashed" />
                      )
                    }
                    type={!item?.is_enabled ? "disabled" : "secondary"}
                  />
                  <ActionGroup>
                    <ToggleButton
                      value={item?.is_enabled}
                      onChange={() => handleToggleMethod(item)}
                    />
                    <DropdownButton
                      dropdownStyle={{ width: "115px" }}
                      buttonProps={{
                        size: "small",
                        style: { transform: "rotate(90deg)" },
                        icon: <ShowMoreIcon />,
                      }}
                      options={[
                        { title: __("Edit", "kirki-ecommerce"), value: "edit" },
                        { title: __("Delete", "kirki-ecommerce"), value: "delete" },
                      ]}
                      onOptionSelect={(action) => handleAction(action, item)}
                    />
                  </ActionGroup>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
        <PaymentGatewayEditPopup
          editedItem={editedItem}
          isOpen={openPopup}
          onClose={() => setOpenPopup(false)}
        />
      </Card>
      {isEditPopupOpen && (
        <PaymentGatewayPopup
          openPopup={isEditPopupOpen}
          setOpenPopup={setIsEditPopupOpen}
          setIsMethodListUpdated={setIsMethodListUpdated}
        />
      )}
    </>
  );
};

export default PaymentGateway;
