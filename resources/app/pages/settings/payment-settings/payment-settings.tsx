import { PaymentIcon } from '@/icons';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { usePaymentGatewaysQuery } from '@/services/payment';
import { usePaymentMethodsQuery } from '@/services/payment';
import { __ } from '@/wpi18n';

import SettingsPageHeader from '@/pages/settings/settings-page-header';
import ManualPayment from '@/pages/settings/payment-settings/manual-payment';
import PaymentGatewayList from '@/pages/settings/payment-settings/payment-gateway';

const PaymentSettings = () => {
  const { data: paymentGatewayList = [] } = usePaymentGatewaysQuery();
  const { data: manualPaymentMethod = [], refetch: refetchMethods } =
    usePaymentMethodsQuery();

  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader
          icon={<PaymentIcon />}
          title={__('Payments', 'kirki-ecommerce')}
        />

        <ManualPayment
          manualPaymentList={manualPaymentMethod}
          refetch={refetchMethods}
        />
        <PaymentGatewayList paymentGatewayList={paymentGatewayList} />
      </Flex>
    </Container>
  );
};

PaymentSettings.displayName = 'PaymentSettings';

export default PaymentSettings;
