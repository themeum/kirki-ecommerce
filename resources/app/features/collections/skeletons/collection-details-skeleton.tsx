import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Skeleton from '@/components/ui/skeleton';
import { cardStyles } from '@/theme/card-styles';

const FieldSkeleton = ({ controlHeight = 36 }: { controlHeight?: number }) => (
  <Flex direction="column" gap={2}>
    <Skeleton width={96} height={12} />
    <Skeleton height={controlHeight} />
  </Flex>
);

FieldSkeleton.displayName = 'FieldSkeleton';

const CollectionDetailsSkeleton = () => {
  return (
    <Container size="md">
      <Flex direction="column" gap={4}>
        <Card cssOverride={cardStyles.formCard}>
          <CardContent>
            <Flex direction="column" gap={4}>
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton controlHeight={96} />
              <FieldSkeleton controlHeight={120} />
            </Flex>
          </CardContent>
        </Card>

        <Card cssOverride={cardStyles.formCard}>
          <CardContent>
            <Flex direction="column" gap={4}>
              <FieldSkeleton />
              <FieldSkeleton controlHeight={72} />
            </Flex>
          </CardContent>
        </Card>
      </Flex>
    </Container>
  );
};

CollectionDetailsSkeleton.displayName = 'CollectionDetailsSkeleton';

export default CollectionDetailsSkeleton;
