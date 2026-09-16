import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';

type GeneralTaxRegionStateSkeletonProps = {
  cards?: number[];
};

const GeneralTaxRegionStateSkeleton = ({ cards = [2, 3] }: GeneralTaxRegionStateSkeletonProps) => (
  <Container size="sm">
    <SettingsPageSkeleton cards={cards} header={<SettingsPageHeader title="" />} />
  </Container>
);

GeneralTaxRegionStateSkeleton.displayName = 'GeneralTaxRegionStateSkeleton';

export default GeneralTaxRegionStateSkeleton;
