import PageHeadingSkeleton from '@/components/skeletons/page-heading-skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import Grid from '@/components/ui/grid';
import { Page, PageContent } from '@/components/ui/page';
import { Separator } from '@/components/ui/separator';
import Skeleton from '@/components/ui/skeleton';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles } from '@/theme/mixins';

const LEFT_SIDE_PANEL_WIDTH = '624px';
const RIGHT_SIDE_PANEL_WIDTH = '320px';
const MEDIA_TILE_SIZE = 139;

type FieldSkeletonProps = {
  controlHeight?: number;
  hasLabel?: boolean;
};

const FieldSkeleton = ({ controlHeight = 36, hasLabel = true }: FieldSkeletonProps) => (
  <Flex direction="column" gap={2} cssOverride={{ width: '100%' }}>
    {hasLabel && <Skeleton width={96} height={12} />}
    <Skeleton height={controlHeight} width="100%" />
  </Flex>
);

FieldSkeleton.displayName = 'FieldSkeleton';

const CheckboxRowSkeleton = () => (
  <Flex align="center" gap={2}>
    <Skeleton width={16} height={16} radius="sm" />
    <Skeleton width={140} height={12} />
  </Flex>
);

CheckboxRowSkeleton.displayName = 'CheckboxRowSkeleton';

const CardTitleSkeleton = ({ descriptionWidth }: { descriptionWidth?: number }) => (
  <CardHeader>
    <Flex direction="column" gap={2}>
      <Skeleton width={100} height={16} />
      {descriptionWidth !== undefined && <Skeleton width={descriptionWidth} height={12} />}
    </Flex>
  </CardHeader>
);

CardTitleSkeleton.displayName = 'CardTitleSkeleton';

const BasicInfoCardSkeleton = () => (
  <Card cssOverride={cardStyles.formCard}>
    <CardContent>
      <Flex direction="column" gap={4}>
        <FieldSkeleton />
        <FieldSkeleton controlHeight={140} />
        <Flex direction="column" gap={2}>
          <Flex align="center" justify="space-between">
            <Skeleton width={120} height={12} />
            <Skeleton width={72} height={32} />
          </Flex>
        </Flex>
      </Flex>
    </CardContent>
  </Card>
);

BasicInfoCardSkeleton.displayName = 'BasicInfoCardSkeleton';

const MediaCardSkeleton = () => (
  <Card>
    <CardContent>
      <Flex direction="column" gap={2}>
        <Skeleton width={96} height={12} />
        <Grid columns={4} gap={3} cssOverride={{ gridAutoRows: `${MEDIA_TILE_SIZE}px` }}>
          <Skeleton cssOverride={{ gridColumn: 'span 2', gridRow: 'span 2' }} height="100%" />
          <Skeleton height={MEDIA_TILE_SIZE} />
          <Skeleton height={MEDIA_TILE_SIZE} />
          <Skeleton height={MEDIA_TILE_SIZE} />
          <Skeleton height={MEDIA_TILE_SIZE} />
        </Grid>
      </Flex>
    </CardContent>
  </Card>
);

MediaCardSkeleton.displayName = 'MediaCardSkeleton';

const PriceCardSkeleton = () => (
  <Card cssOverride={cardStyles.formCard}>
    <CardTitleSkeleton />
    <CardContent cssOverride={styles.stackedContent}>
      <FieldSkeleton hasLabel={false} />
      <Flex gap={2} wrap="wrap">
        <Skeleton width={110} height={32} />
        <Skeleton width={110} height={32} />
        <Skeleton width={130} height={32} />
      </Flex>
      <Separator negativeMargin={16} />
      <CheckboxRowSkeleton />
    </CardContent>
  </Card>
);

PriceCardSkeleton.displayName = 'PriceCardSkeleton';

const InventoryCardSkeleton = () => (
  <Card cssOverride={cardStyles.formCard}>
    <CardTitleSkeleton />
    <CardContent cssOverride={styles.stackedContent}>
      <CheckboxRowSkeleton />
      <Grid columns={3} gap={4}>
        <FieldSkeleton />
        <FieldSkeleton />
        <FieldSkeleton />
      </Grid>
      <Flex direction="column" gap={1}>
        <Flex align="center" justify="space-between">
          <Skeleton width={80} height={12} />
          <Skeleton width={72} height={20} />
        </Flex>
        <Skeleton height={36} width="100%" />
      </Flex>
      <CheckboxRowSkeleton />
      <CheckboxRowSkeleton />
    </CardContent>
  </Card>
);

InventoryCardSkeleton.displayName = 'InventoryCardSkeleton';

const ShippingCardSkeleton = () => (
  <Card cssOverride={cardStyles.formCard}>
    <CardTitleSkeleton />
    <CardContent cssOverride={styles.stackedContent}>
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
    </CardContent>
  </Card>
);

ShippingCardSkeleton.displayName = 'ShippingCardSkeleton';

const VariantsCardSkeleton = () => (
  <Card cssOverride={cardStyles.formCard}>
    <CardTitleSkeleton descriptionWidth={220} />
    <CardContent>
      <Skeleton width={100} height={36} />
    </CardContent>
  </Card>
);

VariantsCardSkeleton.displayName = 'VariantsCardSkeleton';

const SEOCardSkeleton = () => (
  <Card cssOverride={cardStyles.formCard}>
    <CardContent cssOverride={styles.stackedContent}>
      <Flex gap={2} cssOverride={{ maxWidth: '270px' }}>
        <Skeleton width={130} height={32} />
        <Skeleton width={130} height={32} />
      </Flex>
      <Skeleton height={90} width="100%" />
      <Separator />
      <FieldSkeleton />
      <FieldSkeleton controlHeight={110} />
    </CardContent>
  </Card>
);

SEOCardSkeleton.displayName = 'SEOCardSkeleton';

const StatusCardSkeleton = () => (
  <Card cssOverride={cardStyles.formCard}>
    <CardContent cssOverride={styles.stackedContent}>
      <FieldSkeleton />
      <Flex align="center">
        <Skeleton width={100} height={32} />
        <Skeleton width={180} height={32} />
      </Flex>
    </CardContent>
  </Card>
);

StatusCardSkeleton.displayName = 'StatusCardSkeleton';

const CollapsedFieldRowSkeleton = () => (
  <Flex align="center" justify="space-between">
    <Skeleton width={80} height={12} />
    <Skeleton width={72} height={32} />
  </Flex>
);

CollapsedFieldRowSkeleton.displayName = 'CollapsedFieldRowSkeleton';

const TaxonomyCardSkeleton = () => (
  <Card cssOverride={cardStyles.formCard}>
    <CardContent cssOverride={styles.stackedContent}>
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />
      <Flex direction="column" gap={2}>
        <CollapsedFieldRowSkeleton />
        <CollapsedFieldRowSkeleton />
      </Flex>
    </CardContent>
  </Card>
);

TaxonomyCardSkeleton.displayName = 'TaxonomyCardSkeleton';

const ProductFormSkeleton = () => {
  return (
    <Page containerSize="lg">
      <PageHeadingSkeleton>
        <Skeleton width={72} height={32} />
        <Skeleton width={72} height={32} />
      </PageHeadingSkeleton>
      <PageContent>
        <Grid template={`${LEFT_SIDE_PANEL_WIDTH} ${RIGHT_SIDE_PANEL_WIDTH}`} gap={4}>
          <Flex direction="column" gap={4}>
            <BasicInfoCardSkeleton />
            <MediaCardSkeleton />
            <PriceCardSkeleton />
            <InventoryCardSkeleton />
            <ShippingCardSkeleton />
            <VariantsCardSkeleton />
            <SEOCardSkeleton />
          </Flex>
          <Flex direction="column" gap={4}>
            <StatusCardSkeleton />
            <TaxonomyCardSkeleton />
          </Flex>
        </Grid>
      </PageContent>
    </Page>
  );
};

ProductFormSkeleton.displayName = 'ProductFormSkeleton';

export default ProductFormSkeleton;

const styles = defineStyles({
  stackedContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
  },
});
