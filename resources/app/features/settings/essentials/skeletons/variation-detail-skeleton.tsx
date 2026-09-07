import Container from '@/components/ui/container';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';

type VariationDetailSkeletonProps = {
  title?: string;
};

const VariationDetailSkeleton = ({ title = '' }: VariationDetailSkeletonProps) => (
  <Container size="sm">
    <SettingsPageSkeleton cards={[4]} header={<SettingsPageHeader title={title} />} />
  </Container>
);

VariationDetailSkeleton.displayName = 'VariationDetailSkeleton';

export default VariationDetailSkeleton;
