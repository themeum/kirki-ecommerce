import { Card } from '@/components/ui/card';
import Text from '@/components/ui/text';
import OverviewTitle from '@/features/home/components/overview-title';
import SkeletonLine from '@/features/home/components/skeleton-line';
import { theme } from '@/theme';
import { defineStyles } from '@/theme/mixins';

type MetricCardProps = {
  label: string;
  info: string;
  value?: string;
  valueTitle?: string;
};

const MetricCard = (props: MetricCardProps) => {
  const { label, info, value, valueTitle } = props;

  return (
    <Card cssOverride={styles.card}>
      <OverviewTitle info={info}>
        <Text variant="small" color="subdued">
          {label}
        </Text>
      </OverviewTitle>
      {value === undefined ? (
        <SkeletonLine width="120px" lineHeight="26px" barHeight="20px" />
      ) : (
        <Text variant="heading4" weight="bold" truncate title={valueTitle}>
          {value}
        </Text>
      )}
    </Card>
  );
};

MetricCard.displayName = 'MetricCard';

export default MetricCard;

const styles = defineStyles({
  card: {
    gap: theme.spacing[1],
    padding: theme.spacing[3],
    minWidth: 0,
    '& [data-tooltip]': {
      opacity: 0,
      transition: 'opacity 0.15s ease',
    },
    '&:hover [data-tooltip]': {
      opacity: 1,
    },
    '@media (hover: none)': {
      '& [data-tooltip]': {
        opacity: 1,
      },
    },
  },
});
