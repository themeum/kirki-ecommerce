import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';
import { CartIcon } from '@/icons';
import { __ } from '@/wpi18n';

const CheckoutSettingsSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton
      cards={[1, 8, 2]}
      header={<SettingsPageHeader icon={<CartIcon />} title={__('Checkout', 'kirki-ecommerce')} />}
    />
  </Container>
);

CheckoutSettingsSkeleton.displayName = 'CheckoutSettingsSkeleton';

export default CheckoutSettingsSkeleton;
