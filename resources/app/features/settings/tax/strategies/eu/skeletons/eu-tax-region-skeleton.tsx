import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';

type EUTaxRegionSkeletonProps = {
  cards?: number[];
};

const EUTaxRegionSkeleton = ({ cards = [3, 2, 2] }: EUTaxRegionSkeletonProps) => (
  <Container size="sm">
    <SettingsPageSkeleton cards={cards} header={<SettingsPageHeader title="" />} />
  </Container>
);

EUTaxRegionSkeleton.displayName = 'EUTaxRegionSkeleton';

export default EUTaxRegionSkeleton;
