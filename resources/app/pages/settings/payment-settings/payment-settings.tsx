import PageNavbar from '@/components/page-navbar';
import { PaymentIcon } from '@/icons';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import { usePaymentGatewaysQuery } from '@/services/payment';
import { usePaymentMethodsQuery } from '@/services/payment';
import { __ } from '@/wpi18n';

import ManualPayment from '@/pages/settings/payment-settings/manual-payment';
import PaymentGatewayList from '@/pages/settings/payment-settings/payment-gateway';

const PaymentSettings = () => {
  const { data: paymentGatewayList = [] } = usePaymentGatewaysQuery();
  const { data: manualPaymentMethod = [], refetch: refetchMethods } =
    usePaymentMethodsQuery();

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
            refetch={refetchMethods}
          />
          <PaymentGatewayList paymentGatewayList={paymentGatewayList} />
        </Flex>
      </Container>
    </>
  );
};

PaymentSettings.displayName = 'PaymentSettings';

export default PaymentSettings;
