import { Card, CardContent } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { PageContent } from '@/components/ui/page';
import Skeleton from '@/components/ui/skeleton';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';

const FieldSkeleton = () => (
  <Flex direction="column" gap={2}>
    <Skeleton width={96} height={12} />
    <Skeleton height={36} />
  </Flex>
);

FieldSkeleton.displayName = 'FieldSkeleton';

const CardSkeleton = ({ fields }: { fields: number }) => (
  <Card cssOverride={cardStyles.formCard}>
    <CardContent>
      <Flex direction="column" gap={4}>
        {Array.from({ length: fields }, (_, index) => (
          <FieldSkeleton key={index} />
        ))}
      </Flex>
    </CardContent>
  </Card>
);

CardSkeleton.displayName = 'CardSkeleton';

const CustomerDetailsSkeleton = () => {
  return (
    <PageContent>
      <Flex gap={4} cssOverride={styles.row}>
        <Flex direction="column" gap={4} cssOverride={styles.mainColumn}>
          <CardSkeleton fields={4} />
          <CardSkeleton fields={5} />
          <CardSkeleton fields={5} />
        </Flex>
        <Flex direction="column" gap={4} cssOverride={styles.sideColumn}>
          <CardSkeleton fields={1} />
          <CardSkeleton fields={1} />
        </Flex>
      </Flex>
    </PageContent>
  );
};

CustomerDetailsSkeleton.displayName = 'CustomerDetailsSkeleton';

export default CustomerDetailsSkeleton;

const styles = defineStyles({
  row: {
    width: '100%',
    alignItems: 'flex-start',
  },
  mainColumn: {
    width: '70%',
  },
  sideColumn: {
    width: '30%',
  },
});
