import { CheckedIcon, StripeIcon } from "icons";
import {
  ActionGroup,
  Button,
  Card,
  Flex,
  Popover,
  PopoverBody,
  PopoverHeader,
  Text,
} from "molecules";
import React from "react";
import { useState, useEffect } from "react";
import { __ } from "wpi18n";
import {
  getAvailablePaymentGatewayAPI,
  installPaymentGatewayAPI,
} from "../../../store/settingsSlice";

const PaymentGatewayPopup = ({
  openPopup,
  setOpenPopup,
  setIsMethodListUpdated,
}) => {
  const [availableGatewayList, setAvailableGatewayList] = useState([]);

  const fetchPaymentGateway = async () => {
    const result = await getAvailablePaymentGatewayAPI();
    if (result.success) setAvailableGatewayList(result.data);
  };

  useEffect(() => {
    fetchPaymentGateway();
  }, []);

  const handleInstallPaymentGateway = async (item) => {
    const gatewayID = { id: item?.id };
    const result = await installPaymentGatewayAPI(gatewayID);
    if (result?.success) {
      fetchPaymentGateway();
      setIsMethodListUpdated(true);
    }
  };

  return (
    <Popover isOpen={openPopup} style={{ width: "600px" }}>
      <PopoverHeader
        style={{ padding: "var(--decom-spacing-5)" }}
        onClose={() => setOpenPopup(false)}
      >
        {__("Available Payment Gateways", "kirki-ecommerce")}
      </PopoverHeader>
      <PopoverBody
        style={{
          padding:
            "var(--decom-spacing-0) var(--decom-spacing-5) var(--decom-spacing-5) var(--decom-spacing-5)",
        }}
      >
        <Flex direction="column" gap={16}>
          {availableGatewayList?.map((item, index) => (
            <Card
              type="inner"
              key={index}
              style={{
                padding: "var(--decom-spacing-3) var(--decom-spacing-4)",
              }}
            >
              <Flex style={{ alignItems: "center" }}>
                <Text
                  header={item?.name}
                  type="secondary"
                  leftIcon={<StripeIcon />} // need to update from the backend
                />
                <ActionGroup>
                  {item?.is_installed === true ? (
                    <Button
                      type="primarySoft"
                      size="small"
                      text={__("Added", "kirki-ecommerce")}
                      leftIcon={<CheckedIcon />}
                      style={{
                        background: "transparent",
                      }}
                    />
                  ) : (
                    <Button
                      type="secondary"
                      size="small"
                      text={__("Add", "kirki-ecommerce")}
                      onClick={() => handleInstallPaymentGateway(item)}
                    />
                  )}
                </ActionGroup>
              </Flex>
            </Card>
          ))}
        </Flex>
      </PopoverBody>
    </Popover>
  );
};

export default PaymentGatewayPopup;
