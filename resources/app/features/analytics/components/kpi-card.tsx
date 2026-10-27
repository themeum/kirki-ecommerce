import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import AnalyticsCard from '@/features/analytics/components/analytics-card';
import ChangeBadge from '@/features/analytics/components/change-badge';
import Sparkline from '@/features/analytics/components/charts/sparkline';
import type { SeriesPoint } from '@/features/analytics/schemas/catalog/analytics';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type KpiCardProps = {
  metricKey: string;
  title: string;
  info: string;
  value: { text: string; title?: string };
  change?: number | null;
  hasComparison: boolean;
  series: SeriesPoint[];
};

const KpiCard = (props: KpiCardProps) => {
  const { metricKey, title, info, value, change, hasComparison, series } = props;

  return (
    <AnalyticsCard
      title={title}
      info={info}
      testId={`kpi-${metricKey}`}
      titleVariant="label"
      cssOverride={styles.card}
    >
      <Text variant="heading4" weight="bold" truncate title={value.title}>
        {value.text}
      </Text>
      <Flex align="center" justify="space-between" gap={2} cssOverride={styles.change}>
        {hasComparison ? (
          <ChangeBadge change={change} />
        ) : (
          <Text variant="tiny" color="subdued">
            {__('No comparison', 'kirki-ecommerce')}
          </Text>
        )}
        <div css={scoped(styles.sparkline)}>
          <Sparkline points={series} />
        </div>
      </Flex>
    </AnalyticsCard>
  );
};

KpiCard.displayName = 'KpiCard';

export default KpiCard;

const styles = defineStyles({
  card: {
    flex: '1 1 0',
    gap: theme.spacing[2],
    padding: theme.spacing[3],
  },
  change: {
    minHeight: '32px',
  },
  sparkline: {
    flex: '0 1 120px',
    minWidth: 0,
  },
});
