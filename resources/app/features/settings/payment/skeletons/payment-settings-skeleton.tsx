import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { PaymentIcon } from '@/icons';
import { __ } from '@/wpi18n';

const PaymentSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[3, 3]}
    header={
      <SettingsPageHeader
        icon={<PaymentIcon />}
        title={__('Payments', 'kirki-ecommerce')}
      />
    }
  />
);

PaymentSettingsSkeleton.displayName = 'PaymentSettingsSkeleton';

export default PaymentSettingsSkeleton;
