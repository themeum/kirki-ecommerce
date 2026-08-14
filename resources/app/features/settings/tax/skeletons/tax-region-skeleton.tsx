import SettingsPageSkeleton from '@/features/settings/skeletons/settings-page-skeleton';

type TaxRegionSkeletonProps = {
  cards?: number[];
};

const TaxRegionSkeleton = ({ cards = [2, 3] }: TaxRegionSkeletonProps) => (
  <SettingsPageSkeleton cards={cards} />
);

TaxRegionSkeleton.displayName = 'TaxRegionSkeleton';

export default TaxRegionSkeleton;
