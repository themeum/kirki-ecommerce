import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { TruckIcon } from '@/icons';
import { __ } from '@/wpi18n';

const ShippingSettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[2, 3, 2, 2]}
      header={<SettingsPageHeader icon={<TruckIcon />} title={__('Shipping', 'kirki-ecommerce')} />}
    />
  </Container>
);

ShippingSettingsSkeleton.displayName = 'ShippingSettingsSkeleton';

export default ShippingSettingsSkeleton;
