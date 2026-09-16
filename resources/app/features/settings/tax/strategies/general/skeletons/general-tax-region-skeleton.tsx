import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';

type GeneralTaxRegionSkeletonProps = {
  cards?: number[];
};

const GeneralTaxRegionSkeleton = ({ cards = [6] }: GeneralTaxRegionSkeletonProps) => (
  <Container size="sm">
    <SettingsPageSkeleton cards={cards} header={<SettingsPageHeader title="" />} />
  </Container>
);

GeneralTaxRegionSkeleton.displayName = 'GeneralTaxRegionSkeleton';

export default GeneralTaxRegionSkeleton;
