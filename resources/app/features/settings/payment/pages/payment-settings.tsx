import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import PaymentMethods from '@/features/settings/payment/components/list/payment-methods';
import { usePaymentMethodsQuery } from '@/features/settings/payment/services/payment';
import PaymentSettingsSkeleton from '@/features/settings/payment/skeletons/payment-settings-skeleton';
import { PaymentIcon } from '@/icons/common';
import { __ } from '@/wpi18n';

const PaymentSettings = () => {
  const { data: paymentMethods = [], isFetching: isLoading } = usePaymentMethodsQuery();

  if (isLoading) {
    return <PaymentSettingsSkeleton />;
  }

  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader icon={<PaymentIcon />} title={__('Payments', 'kirki-ecommerce')} />

        <PaymentMethods paymentMethods={paymentMethods} />
      </Flex>
    </Container>
  );
};

PaymentSettings.displayName = 'PaymentSettings';

export default PaymentSettings;
