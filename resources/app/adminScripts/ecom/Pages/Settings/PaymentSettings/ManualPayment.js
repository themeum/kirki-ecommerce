import React, { useState } from "react";
import {
  Card,
  Flex,
  Text,
  ActionGroup,
  ToggleButton,
  Badge,
} from "../../../molecules";
import DropdownButton from "../../../components/DropdownButton";
import { __, sprintf } from "wpi18n";
import ManualPaymentPopup from "./ManualPaymentPopup";
import { BankIconLarge, ShowMoreIcon, CashIcon } from "icons";
import {
  deletePaymentMethodAPI,
  updatePaymentMethodAPI,
} from "../../../store/settingsSlice";
import { dispatchToastMessage } from "../../utils";
import HeaderActionsCard from "../../../components/HeaderActionsCard";

const ManualPayment = (props) => {
  const { manualPaymentList, setManualPaymentMethod, setIsMethodListUpdated } =
    props;

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);

  const handleAction = (action, item) => {
    if (action === "delete") {
      const initialList = [...manualPaymentList];
      const updatedPaymentList = manualPaymentList?.filter(
        (method) => method?.id !== item?.id
      );
      setManualPaymentMethod(updatedPaymentList);
      dispatchToastMessage("delete", {
        title: __("Payment method deleted", "kirki-ecommerce"),
        duration: 5000,
        undoAction: () => {
          setManualPaymentMethod(initialList);
        },
        onSuccess: async () => {
          await deletePaymentMethodAPI(item.id);
        },
      });
    }
    if (action === "edit") {
      setEditingMethod(item);
      setIsPopupOpen(true);
    }
  };

  const handleToggleMethod = async (item) => {
    const updatedItem = { ...item, is_enabled: !item?.is_enabled };

    const result = await updatePaymentMethodAPI(item?.id, updatedItem);
    if (result.success) {
      setManualPaymentMethod((prev) =>
        prev.map((method) => (method.id === item.id ? result.data : method))
      );

      dispatchToastMessage("success", {
        title: __("Payment method updated", "kirki-ecommerce"),
      });
    } else {
      dispatchToastMessage("error", {
        title: __("Something went wrong", "kirki-ecommerce"),
      });
    }
  };
  return (
    <>
      <Card type="large">
        <HeaderActionsCard
          header={__("Manual payment methods", "kirki-ecommerce")}
          subHeader={__(
            "For manual payments, you'll need to approve orders made outside your online store. Add Manual Payment",
            "kirki-ecommerce"
          )}
          buttonText={__("Add Payment Methods", "kirki-ecommerce")}
          onAdd={() => setIsPopupOpen(true)}
        />

        {manualPaymentList?.length === 0 ? (
          <Card
            type="innerDark"
            style={{ padding: "var(--decom-spacing-9) var(--decom-spacing-0)" }}
          >
            <Flex direction="column" gap={8} style={{ alignItems: "center" }}>
              <CashIcon />
              <span style={{ color: "var(--decom-text-text-subdued)" }}>
                {__("No payment added yet", "kirki-ecommerce")}
              </span>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" gap={16}>
            {manualPaymentList?.map((item, index) => (
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
                    leftIcon={
                      <img height={20} width={20} src={item?.icon}></img> || (
                        <BankIconLarge />
                      )
                    }
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
      </Card>
      <ManualPaymentPopup
        openPopup={isPopupOpen}
        setOpenPopup={setIsPopupOpen}
        setIsMethodListUpdated={setIsMethodListUpdated}
        editingMethod={editingMethod}
        setEditingMethod={setEditingMethod}
      />
    </>
  );
};

export default ManualPayment;
