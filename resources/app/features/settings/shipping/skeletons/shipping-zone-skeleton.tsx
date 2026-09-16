import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';

const ShippingZoneSkeleton = () => (
  <Container size="sm">
    <SettingsPageSkeleton cards={[3, 3]} header={<SettingsPageHeader title="" />} />
  </Container>
);

ShippingZoneSkeleton.displayName = 'ShippingZoneSkeleton';

export default ShippingZoneSkeleton;
