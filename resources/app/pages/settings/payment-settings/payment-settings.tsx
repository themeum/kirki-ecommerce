import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { PaymentIcon } from '@/icons';
import OfflinePayment from '@/pages/settings/payment-settings/offline-payment';
import OnlinePaymentList from '@/pages/settings/payment-settings/online-payment-list';
import SettingsPageHeader from '@/pages/settings/settings-page-header';
import { useOfflinePaymentsQuery, useOnlinePaymentsQuery } from '@/services/payment';
import { __ } from '@/wpi18n';

const PaymentSettings = () => {
  const { data: onlinePaymentList = [] } = useOnlinePaymentsQuery();
  const { data: offlinePaymentList = [], refetch: refetchOfflinePayments } =
    useOfflinePaymentsQuery();

  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader
          icon={<PaymentIcon />}
          title={__('Payments', 'kirki-ecommerce')}
        />

        <OfflinePayment
          offlinePaymentList={offlinePaymentList}
          refetch={refetchOfflinePayments}
        />
        <OnlinePaymentList onlinePaymentList={onlinePaymentList} />
      </Flex>
    </Container>
  );
};

PaymentSettings.displayName = 'PaymentSettings';

export default PaymentSettings;
