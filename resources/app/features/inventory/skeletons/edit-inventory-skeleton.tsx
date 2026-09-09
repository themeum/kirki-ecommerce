import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Skeleton from '@/components/ui/skeleton';
import { cardStyles } from '@/theme/card-styles';

const FieldSkeleton = ({ controlHeight = 36 }: { controlHeight?: number }) => (
  <Flex direction="column" gap={2}>
    <Skeleton width={96} height={12} />
    <Skeleton height={controlHeight} />
  </Flex>
);

FieldSkeleton.displayName = 'FieldSkeleton';

const EditInventorySkeleton = () => {
  return (
    <Container>
      <Flex gap={4}>
        <Flex direction="column" gap={4} cssOverride={{ width: '70%' }}>
          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <Flex direction="column" gap={4}>
                <Grid columns={2}>
                  <FieldSkeleton />
                  <FieldSkeleton />
                </Grid>
                <FieldSkeleton controlHeight={44} />
                <FieldSkeleton controlHeight={44} />
                <Grid columns={3}>
                  <FieldSkeleton />
                  <FieldSkeleton />
                  <FieldSkeleton />
                </Grid>
              </Flex>
            </CardContent>
          </Card>

          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <Flex direction="column" gap={4}>
                <FieldSkeleton controlHeight={20} />
                <FieldSkeleton />
                <FieldSkeleton />
                <Grid gap={2} template="1fr 2fr">
                  <FieldSkeleton controlHeight={44} />
                  <FieldSkeleton controlHeight={44} />
                </Grid>
              </Flex>
            </CardContent>
          </Card>

          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <Flex direction="column" gap={4}>
                <FieldSkeleton />
                <FieldSkeleton controlHeight={44} />
                <FieldSkeleton controlHeight={44} />
              </Flex>
            </CardContent>
          </Card>
        </Flex>

        <Flex direction="column" gap={4} cssOverride={{ width: '30%' }}>
          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <FieldSkeleton controlHeight={180} />
            </CardContent>
          </Card>
          <Card cssOverride={cardStyles.formCard}>
            <CardContent>
              <FieldSkeleton controlHeight={44} />
            </CardContent>
          </Card>
        </Flex>
      </Flex>
    </Container>
  );
};

EditInventorySkeleton.displayName = 'EditInventorySkeleton';

export default EditInventorySkeleton;
