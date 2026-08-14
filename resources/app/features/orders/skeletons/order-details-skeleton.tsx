import PageHeadingSkeleton from '@/components/skeletons/page-heading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Page from '@/components/ui/page';
import Skeleton from '@/components/ui/skeleton';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';

const ItemRowSkeleton = () => (
  <Flex align="center" gap={3} cssOverride={styles.itemRow}>
    <Skeleton width={40} height={40} radius="sm" />
    <Flex direction="column" gap={2} cssOverride={styles.grow}>
      <Skeleton width="45%" height={12} />
      <Skeleton width="25%" height={12} />
    </Flex>
    <Skeleton width={64} height={12} />
  </Flex>
);

ItemRowSkeleton.displayName = 'ItemRowSkeleton';

const AmountRowSkeleton = () => (
  <Flex align="center" justify="space-between">
    <Skeleton width={96} height={12} />
    <Skeleton width={72} height={12} />
  </Flex>
);

AmountRowSkeleton.displayName = 'AmountRowSkeleton';

const SideCardSkeleton = ({ rows }: { rows: number }) => (
  <Card cssOverride={cardStyles.formCard}>
    <CardHeader>
      <CardTitle>
        <Skeleton width={120} height={14} />
      </CardTitle>
    </CardHeader>
    <CardContent>
      <Flex direction="column" gap={3}>
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} height={12} />
        ))}
      </Flex>
    </CardContent>
  </Card>
);

SideCardSkeleton.displayName = 'SideCardSkeleton';

const OrderDetailsSkeleton = () => {
  return (
    <Page>
      <PageHeadingSkeleton>
        <Skeleton width={40} height={32} />
      </PageHeadingSkeleton>
      <Container>
        <Flex gap={4} cssOverride={styles.row}>
          <Flex direction="column" gap={4} cssOverride={styles.mainColumn}>
            <Card cssOverride={cardStyles.formCard}>
              <CardHeader>
                <CardTitle>
                  <Skeleton width={96} height={14} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Card cssOverride={cardStyles.innerCard}>
                  <CardContent cssOverride={styles.zeroPadding}>
                    <Flex direction="column">
                      {Array.from({ length: 3 }, (_, index) => (
                        <ItemRowSkeleton key={index} />
                      ))}
                    </Flex>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            <Card cssOverride={cardStyles.formCard}>
              <CardHeader>
                <CardTitle>
                  <Skeleton width={96} height={14} />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Flex direction="column" gap={3}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <AmountRowSkeleton key={index} />
                  ))}
                </Flex>
              </CardContent>
            </Card>
          </Flex>

          <Flex direction="column" gap={4} cssOverride={styles.sideColumn}>
            <SideCardSkeleton rows={2} />
            <SideCardSkeleton rows={3} />
            <SideCardSkeleton rows={1} />
            <SideCardSkeleton rows={2} />
          </Flex>
        </Flex>
      </Container>
    </Page>
  );
};

OrderDetailsSkeleton.displayName = 'OrderDetailsSkeleton';

export default OrderDetailsSkeleton;

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
  itemRow: {
    padding: theme.spacing[3],
    borderBottom: `1px solid ${theme.colors.border.tertiary}`,
  },
  grow: {
    flexGrow: 1,
  },
  zeroPadding: {
    padding: theme.spacing[0],
  },
});
