import Flex from '@/components/ui/flex';
import Skeleton from '@/components/ui/skeleton';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type CustomerSearchSkeletonProps = {
  rowCount?: number;
};

const DEFAULT_ROW_COUNT = 4;
const AVATAR_SIZE = 32;

const CustomerSearchSkeleton = ({ rowCount = DEFAULT_ROW_COUNT }: CustomerSearchSkeletonProps) => (
  <Flex direction="column" aria-busy>
    {Array.from({ length: rowCount }, (_, index) => (
      <Flex key={index} gap={2} align="center" cssOverride={styles.row}>
        <Skeleton width={AVATAR_SIZE} height={AVATAR_SIZE} radius="full" />
        <Flex direction="column" gap={1} cssOverride={styles.grow}>
          <Skeleton width="55%" height={12} />
          <Skeleton width="75%" height={12} />
        </Flex>
      </Flex>
    ))}
  </Flex>
);

CustomerSearchSkeleton.displayName = 'CustomerSearchSkeleton';

export default CustomerSearchSkeleton;

const styles = defineStyles({
  row: {
    padding: `${theme.spacing[2]} ${theme.spacing[2]}`,
  },
  grow: {
    flexGrow: 1,
  },
});
