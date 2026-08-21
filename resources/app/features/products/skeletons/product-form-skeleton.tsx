import PageHeadingSkeleton from '@/components/skeletons/page-heading-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import Page from '@/components/ui/page';
import Skeleton from '@/components/ui/skeleton';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';

type FieldSkeletonProps = {
  controlHeight?: number;
};

const FieldSkeleton = ({ controlHeight = 36 }: FieldSkeletonProps) => (
  <Flex direction="column" gap={2} cssOverride={{ width: '100%' }}>
    <Skeleton width={96} height={12} />
    <Skeleton height={controlHeight} width="100%" />
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

const BasicCardSkeleton = () => (
  <Card cssOverride={cardStyles.formCard}>
    <CardContent cssOverride={{ width: '100%' }}>
      <Flex direction="column" gap={4}>
        <Grid gap={4} template="2fr 1fr">
          <FieldSkeleton />
          <FieldSkeleton />
        </Grid>
        <FieldSkeleton />
        <Grid gap={2} columns={2}>
          <Skeleton width={320} height={320} />
          <Grid gap={2} columns={2}>
            <Skeleton width={152} height={152} />
            <Skeleton width={152} height={152} />
            <Skeleton width={152} height={152} />
            <Skeleton width={152} height={152} />
          </Grid>
        </Grid>
        <FieldSkeleton />
        <FieldSkeleton />
      </Flex>
    </CardContent>
  </Card>
);

CardSkeleton.displayName = 'CardSkeleton';

const ProductFormSkeleton = () => {
  return (
    <Page>
      <PageHeadingSkeleton>
        <Skeleton width={72} height={32} />
        <Skeleton width={72} height={32} />
      </PageHeadingSkeleton>
      <Container>
        <Flex gap={4} cssOverride={styles.row}>
          <Flex direction="column" gap={4} cssOverride={styles.mainColumn}>
            <BasicCardSkeleton />
            <CardSkeleton fields={4} />
          </Flex>
          <Flex direction="column" gap={4} cssOverride={styles.sideColumn}>
            <CardSkeleton fields={1} />
            <CardSkeleton fields={6} />
            <CardSkeleton fields={3} />
          </Flex>
        </Flex>
      </Container>
    </Page>
  );
};

ProductFormSkeleton.displayName = 'ProductFormSkeleton';

export default ProductFormSkeleton;

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
