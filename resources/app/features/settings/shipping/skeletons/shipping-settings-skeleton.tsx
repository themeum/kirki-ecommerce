import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { TruckIcon } from '@/icons';
import { __ } from '@/wpi18n';

const ShippingSettingsSkeleton = () => (
  <SettingsPageSkeleton
    cards={[2, 3, 2, 2]}
    header={
      <SettingsPageHeader
        icon={<TruckIcon />}
        title={__('Shipping', 'kirki-ecommerce')}
      />
    }
  />
);

ShippingSettingsSkeleton.displayName = 'ShippingSettingsSkeleton';

export default ShippingSettingsSkeleton;
