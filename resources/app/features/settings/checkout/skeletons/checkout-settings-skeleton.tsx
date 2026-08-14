import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { CartIcon } from '@/icons';
import { __ } from '@/wpi18n';

const CheckoutSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[2]}
    header={
      <SettingsPageHeader
        icon={<CartIcon />}
        title={__('Checkout', 'kirki-ecommerce')}
      />
    }
  />
);

CheckoutSettingsSkeleton.displayName = 'CheckoutSettingsSkeleton';

export default CheckoutSettingsSkeleton;
