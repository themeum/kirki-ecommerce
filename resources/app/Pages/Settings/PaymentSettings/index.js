import { PaymentIcon } from "@/Icons";
import { Container, Flex, PageHeading } from "@/molecules";
import React, { useEffect, useState } from "react";
import { __ } from "@/wpi18n";
import PageNavbar from "../../../components/PageNavbar";

import {
  getAddedPaymentGatewayAPI,
  getPaymentMethodListAPI,
} from "../../../store/settingsSlice";
import ManualPayment from "./ManualPayment";
import PaymentGateway from "./PaymentGateway";

const PaymentSettings = () => {
  const [manualPaymentMethod, setManualPaymentMethod] = useState([]);
  const [paymentGatewayList, setPaymentGatewayList] = useState([]);
  const [isMethodListUpdated, setIsMethodListUpdated] = useState(false);

  useEffect(() => {
    const fetchAddedPaymentList = async () => {
      const gatewayResult = await getAddedPaymentGatewayAPI();
      const methodResult = await getPaymentMethodListAPI();

      if (gatewayResult?.success && Array.isArray(gatewayResult.data)) {
        setPaymentGatewayList(gatewayResult.data);
      }
      if (methodResult?.success && Array.isArray(methodResult.data)) {
        setManualPaymentMethod(methodResult.data);
      }
    };

    fetchAddedPaymentList();
    if (isMethodListUpdated) setIsMethodListUpdated(false);
  }, [isMethodListUpdated]);

  return (
    <>
      <PageHeading
        text={__("Settings", "kirki-ecommerce")}
        size="sm"
        sticky
        type="primary"
        style={{ height: "32px" }}
      />
      <Container size="sm">
        <Flex direction="column" gap={16}>
          <PageNavbar
            textIcon={<PaymentIcon />}
            text={__("Payments", "kirki-ecommerce")}
          />

          <ManualPayment
            manualPaymentList={manualPaymentMethod}
            setManualPaymentMethod={setManualPaymentMethod}
            setIsMethodListUpdated={setIsMethodListUpdated}
          />
          <PaymentGateway
            paymentGatewayList={paymentGatewayList}
            setPaymentGatewayList={setPaymentGatewayList}
            setIsMethodListUpdated={setIsMethodListUpdated}
          />
        </Flex>
      </Container>
    </>
  );
};

export default PaymentSettings;
