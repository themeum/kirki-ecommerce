import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';

type VariationDetailSkeletonProps = {
  title?: string;
};

const VariationDetailSkeleton = ({ title = '' }: VariationDetailSkeletonProps) => (
  <SettingsPageSkeleton cards={[4]} header={<SettingsPageHeader title={title} />} />
);

VariationDetailSkeleton.displayName = 'VariationDetailSkeleton';

export default VariationDetailSkeleton;
