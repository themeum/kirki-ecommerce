import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import OfflinePayment from '@/features/settings/payment/pages/offline-payment';
import OnlinePaymentList from '@/features/settings/payment/pages/online-payment-list';
import { useOfflinePaymentsQuery, useOnlinePaymentsQuery } from '@/features/settings/payment/services/payment';
import { PaymentIcon } from '@/icons';
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
