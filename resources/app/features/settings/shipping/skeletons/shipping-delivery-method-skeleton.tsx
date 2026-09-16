import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';

const ShippingDeliveryMethodSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton cards={[4, 4]} header={<SettingsPageHeader title="" />} />
  </Container>
);

ShippingDeliveryMethodSkeleton.displayName = 'ShippingDeliveryMethodSkeleton';

export default ShippingDeliveryMethodSkeleton;
