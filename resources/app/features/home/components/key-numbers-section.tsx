import type { UseQueryResult } from '@tanstack/react-query';

import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import QueryErrorState from '@/components/ui/query-error-state';
import Text from '@/components/ui/text';
import {
  type AnalyticsMetric,
  formatKpiValue,
  getMetricDefinitions,
  type KpiKey,
  useMoney,
} from '@/features/analytics';
import MetricCard from '@/features/home/components/metric-card';
import type { HomeLayoutItem } from '@/features/home/lib/layout';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type KeyNumbersSectionProps = {
  items: HomeLayoutItem<KpiKey>[];
  query: UseQueryResult<AnalyticsMetric<'kpis'>>;
  onHide: (key: KpiKey) => void;
  onCustomize: () => void;
};

const KeyNumbersSection = (props: KeyNumbersSectionProps) => {
  const { items, query, onHide, onCustomize } = props;
  const { format } = useMoney();
  const definitions = getMetricDefinitions();
  const visibleKeys = items.filter((item) => item.visible).map((item) => item.key);

  if (visibleKeys.length === 0) {
    return (
      <Card cssOverride={styles.empty}>
        <Text color="subdued">{__('No key numbers chosen.', 'kirki-ecommerce')}</Text>
        <Button variant="link" onClick={onCustomize}>
          {__('Customize', 'kirki-ecommerce')}
        </Button>
      </Card>
    );
  }

  if (query.isError) {
    return (
      <QueryErrorState onRetry={() => void query.refetch()} isRetrying={query.isFetching} />
    );
  }

  const kpis = query.data?.data;

  return (
    <div css={scoped(styles.grid)} data-testid="home-key-numbers">
      {visibleKeys.map((key) => {
        const value = kpis ? formatKpiValue(key, kpis, format) : undefined;

        return (
          <MetricCard
            key={key}
            label={definitions[key].title}
            info={definitions[key].info}
            value={value?.text}
            valueTitle={value?.title}
            onHide={() => onHide(key)}
          />
        );
      })}
    </div>
  );
};

KeyNumbersSection.displayName = 'KeyNumbersSection';

export default KeyNumbersSection;

const styles = defineStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: theme.spacing[3],
    '@media (min-width: 600px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@media (min-width: 1024px)': {
      gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    },
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[1],
    padding: theme.spacing[6],
  },
});
