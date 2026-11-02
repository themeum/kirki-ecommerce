import { Card } from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

const KpiSkeleton = () => {
  return (
    <Card data-testid="kpi-skeleton" cssOverride={styles.kpi}>
      <Skeleton width="50%" height="14px" />
      <Skeleton width="70%" height="26px" />
      <Skeleton width="100%" height="32px" />
    </Card>
  );
};

KpiSkeleton.displayName = 'KpiSkeleton';

type CardSkeletonProps = {
  size: 'half' | 'full';
};

const CardSkeleton = (props: CardSkeletonProps) => {
  return (
    <Card
      data-testid="card-skeleton"
      cssOverride={{ ...styles.card, ...(props.size === 'full' ? styles.full : {}) }}
    >
      <Skeleton width="40%" height="16px" />
      <Skeleton width="30%" height="26px" />
      <Skeleton width="100%" height="160px" />
    </Card>
  );
};

CardSkeleton.displayName = 'CardSkeleton';

export { CardSkeleton, KpiSkeleton };

const styles = defineStyles({
  kpi: {
    flex: '1 1 0',
    gap: theme.spacing[2],
    padding: theme.spacing[3],
    boxSizing: 'border-box',
  },
  card: {
    flex: '1 1 calc(50% - 8px)',
    gap: theme.spacing[3],
    padding: theme.spacing[4],
    boxSizing: 'border-box',
    minWidth: 0,
    '@media (max-width: 719px)': {
      flexBasis: '100%',
    },
  },
  full: {
    flexBasis: '100%',
  },
});
