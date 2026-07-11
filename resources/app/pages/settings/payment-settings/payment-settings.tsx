import { useEffect, useState } from 'react';

import PageNavbar from '@/components/page-navbar';
import { PaymentIcon } from '@/icons';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import {
  getAddedPaymentGatewayAPI,
  getPaymentMethodListAPI,
} from '@/store/settingsSlice';
import type { PaymentGateway, PaymentMethod } from '@/types';
import { isApiSuccess } from '@/types/pages/api-guards';
import { __ } from '@/wpi18n';

import ManualPayment from './manual-payment';
import PaymentGatewayList from './payment-gateway';

const PaymentSettings = () => {
  const [manualPaymentMethod, setManualPaymentMethod] = useState<
    PaymentMethod[]
  >([]);
  const [paymentGatewayList, setPaymentGatewayList] = useState<
    PaymentGateway[]
  >([]);
  const [isMethodListUpdated, setIsMethodListUpdated] = useState(false);

  useEffect(() => {
    const fetchAddedPaymentList = async () => {
      const gatewayResult = await getAddedPaymentGatewayAPI();
      const methodResult = await getPaymentMethodListAPI();

      if (isApiSuccess(gatewayResult) && Array.isArray(gatewayResult.data)) {
        setPaymentGatewayList(gatewayResult.data as PaymentGateway[]);
      }
      if (isApiSuccess(methodResult) && Array.isArray(methodResult.data)) {
        setManualPaymentMethod(methodResult.data as PaymentMethod[]);
      }
    };

    fetchAddedPaymentList();
    if (isMethodListUpdated) {
      setIsMethodListUpdated(false);
    }
  }, [isMethodListUpdated]);

  return (
    <>
      <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        size="sm"
        sticky
        type="primary"
        style={{ height: '32px' }}
      />
      <Container size="sm">
        <Flex direction="column" gap={16}>
          <PageNavbar
            textIcon={<PaymentIcon />}
            text={__('Payments', 'kirki-ecommerce')}
          />

          <ManualPayment
            manualPaymentList={manualPaymentMethod}
            setManualPaymentMethod={setManualPaymentMethod}
            setIsMethodListUpdated={setIsMethodListUpdated}
          />
          <PaymentGatewayList
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
