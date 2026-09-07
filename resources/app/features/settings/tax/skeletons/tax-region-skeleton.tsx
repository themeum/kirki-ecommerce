import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';

type TaxRegionSkeletonProps = {
  cards?: number[];
};

const TaxRegionSkeleton = ({ cards = [2, 3] }: TaxRegionSkeletonProps) => (
  <Container size="sm">
    <SettingsPageSkeleton cards={cards} header={<SettingsPageHeader title="" />} />
  </Container>
);

TaxRegionSkeleton.displayName = 'TaxRegionSkeleton';

export default TaxRegionSkeleton;
