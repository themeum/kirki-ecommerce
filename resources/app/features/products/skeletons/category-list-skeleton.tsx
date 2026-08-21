import Flex from '@/components/ui/flex';
import Skeleton from '@/components/ui/skeleton';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type CategoryListSkeletonProps = {
  rowCount?: number;
};

const DEFAULT_ROW_COUNT = 5;

const CategoryListSkeleton = ({ rowCount = DEFAULT_ROW_COUNT }: CategoryListSkeletonProps) => (
  <Flex direction="column" aria-busy>
    {Array.from({ length: rowCount }, (_, index) => (
      <Flex key={index} align="center" gap={2} cssOverride={styles.row}>
        <Skeleton width={16} height={16} radius="sm" />
        <Skeleton width="60%" height={12} />
      </Flex>
    ))}
  </Flex>
);

CategoryListSkeleton.displayName = 'CategoryListSkeleton';

export default CategoryListSkeleton;

const styles = defineStyles({
  row: {
    padding: `${theme.spacing[2]} ${theme.spacing[4]}`,
  },
});
