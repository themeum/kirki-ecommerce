import type { UseQueryResult } from '@tanstack/react-query';
import { type ReactNode, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import { Page, PageContent, PageHeading } from '@/components/ui/page';
import QueryErrorState from '@/components/ui/query-error-state';
import Text from '@/components/ui/text';
import AnalyticsControls from '@/features/analytics/components/analytics-controls';
import { CardSkeleton, KpiSkeleton } from '@/features/analytics/components/analytics-skeletons';
import CardError from '@/features/analytics/components/card-error';
import { CardMenuContext } from '@/features/analytics/components/card-menu';
import KpiCard from '@/features/analytics/components/kpi-card';
import { AmountFormatProvider } from '@/features/analytics/contexts/amount-format-context';
import {
  type AnalyticsLayoutControls,
  canHideItem,
  useAnalyticsLayout,
} from '@/features/analytics/hooks/use-analytics-layout';
import { CARD_REGISTRY, type CardSize } from '@/features/analytics/lib/card-registry';
import { formatNumber, formatPercent, moneyValue } from '@/features/analytics/lib/format';
import type { AmountFormat, CardKey, KpiKey } from '@/features/analytics/lib/layout';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import {
  type AnalyticsParams,
  parseAnalyticsParams,
  serializeAnalyticsParams,
} from '@/features/analytics/lib/url-state';
import {
  type AnalyticsKpis,
  type AnalyticsMeta,
  type AnalyticsMetric,
  type AnalyticsMetricKey,
  METRIC_KEYS,
} from '@/features/analytics/schemas/catalog/analytics';
import {
  type AnalyticsMetricQueries,
  useAnalyticsMetricQueries,
} from '@/features/analytics/services/analytics';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type KpiValue = { text: string; title?: string };

const KPI_VALUE_FORMATTERS: {
  [K in KpiKey]: (metric: AnalyticsKpis[K], format: AmountFormat) => KpiValue;
} = {
  gross_sales: (metric, format) => moneyValue(metric.current_money_object, format),
  orders: (metric) => ({ text: formatNumber(metric.current) }),
  average_order_value: (metric, format) => moneyValue(metric.current_money_object, format),
  returning_customer_rate: (metric) => ({ text: formatPercent(metric.current) }),
  net_sales: (metric, format) => moneyValue(metric.current_money_object, format),
  total_sales: (metric, format) => moneyValue(metric.current_money_object, format),
  items_ordered: (metric) => ({ text: formatNumber(metric.current) }),
  discounts: (metric, format) => moneyValue(metric.current_money_object, format),
  new_customers: (metric) => ({ text: formatNumber(metric.current) }),
  customers: (metric) => ({ text: formatNumber(metric.current) }),
  shipping_charges: (metric, format) => moneyValue(metric.current_money_object, format),
};

const formatKpiValue = <K extends KpiKey>(key: K, kpis: AnalyticsKpis, format: AmountFormat) => {
  const formatter = KPI_VALUE_FORMATTERS[key];

  return formatter(kpis[key], format);
};

type CardSlotProps<K extends CardKey> = {
  cardKey: K;
  size: CardSize;
  query: UseQueryResult<AnalyticsMetric<K>>;
  children: (data: AnalyticsMetric<K>['data'], meta: AnalyticsMeta) => ReactNode;
};

const CardSlot = <K extends CardKey>(props: CardSlotProps<K>) => {
  const { cardKey, size, query, children } = props;

  if (query.isError && !query.isFetching) {
    return <CardError cardKey={cardKey} size={size} onRetry={() => void query.refetch()} />;
  }

  if (!query.data || query.isError) {
    return <CardSkeleton size={size} />;
  }

  return children(query.data.data, query.data.meta);
};

CardSlot.displayName = 'CardSlot';

type KpiRowProps = {
  query: UseQueryResult<AnalyticsMetric<'kpis'>>;
  layoutControls: AnalyticsLayoutControls;
};

const KpiRow = (props: KpiRowProps) => {
  const { query, layoutControls } = props;
  const { layout, setVisible } = layoutControls;
  const visibleKpis = layout.kpis.filter((item) => item.visible);

  if (query.isError && !query.isFetching) {
    return (
      <div css={scoped(styles.kpis)}>
        <Card data-testid="kpi-error" cssOverride={styles.kpiError}>
          <QueryErrorState onRetry={() => void query.refetch()} />
        </Card>
      </div>
    );
  }

  if (!query.data || query.isError) {
    return (
      <div css={scoped(styles.kpis)}>
        {visibleKpis.map((item) => (
          <KpiSkeleton key={item.key} />
        ))}
      </div>
    );
  }

  const kpis: AnalyticsKpis = query.data.data;
  const hasComparison = !!query.data.meta.compare;
  const definitions = getMetricDefinitions();

  return (
    <div css={scoped(styles.kpis)}>
      {visibleKpis.map(({ key }) => (
        <CardMenuContext.Provider
          key={key}
          value={{
            canHide: canHideItem(layout.kpis, key),
            onHide: () => setVisible('kpis', key, false),
          }}
        >
          <KpiCard
            metricKey={key}
            title={definitions[key].title}
            info={definitions[key].info}
            value={formatKpiValue(key, kpis, layout.amounts)}
            change={kpis[key].change}
            hasComparison={hasComparison}
            series={kpis[key].series}
          />
        </CardMenuContext.Provider>
      ))}
    </div>
  );
};

KpiRow.displayName = 'KpiRow';

type RegisteredCardProps<K extends CardKey> = {
  cardKey: K;
  query: UseQueryResult<AnalyticsMetric<K>>;
  params: AnalyticsParams;
  layoutControls: AnalyticsLayoutControls;
};

const RegisteredCard = <K extends CardKey>(props: RegisteredCardProps<K>) => {
  const { cardKey, query, params, layoutControls } = props;
  const { layout, setVisible } = layoutControls;
  const entry = CARD_REGISTRY[cardKey];

  return (
    <CardMenuContext.Provider
      value={{
        canHide: canHideItem(layout.cards, cardKey),
        onHide: () => setVisible('cards', cardKey, false),
      }}
    >
      <CardSlot cardKey={cardKey} size={entry.size} query={query}>
        {(data, meta) => entry.render(data, meta, params)}
      </CardSlot>
    </CardMenuContext.Provider>
  );
};

RegisteredCard.displayName = 'RegisteredCard';

type MetricsContentProps = {
  queries: AnalyticsMetricQueries;
  params: AnalyticsParams;
  layoutControls: AnalyticsLayoutControls;
};

const MetricsContent = (props: MetricsContentProps) => {
  const { queries, params, layoutControls } = props;

  const firstMeta = METRIC_KEYS.map((key) => queries[key].data?.meta).find((meta) => !!meta);
  const visibleCards = layoutControls.layout.cards.filter((item) => item.visible);

  return (
    <>
      {firstMeta?.has_orders === false && (
        <div role="status" css={scoped(styles.banner)}>
          <Text variant="small">
            {__(
              'Your store has no orders yet. Analytics fills in as soon as customers start paying for orders.',
              'kirki-ecommerce',
            )}
          </Text>
        </div>
      )}
      <KpiRow query={queries.kpis} layoutControls={layoutControls} />
      <div css={scoped(styles.cards)}>
        {visibleCards.map(({ key }) => (
          <RegisteredCard
            key={key}
            cardKey={key}
            query={queries[key] as UseQueryResult<AnalyticsMetric<typeof key>>}
            params={params}
            layoutControls={layoutControls}
          />
        ))}
      </div>
    </>
  );
};

MetricsContent.displayName = 'MetricsContent';

const Analytics = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseAnalyticsParams(searchParams), [searchParams]);
  const layoutControls = useAnalyticsLayout();
  const { layout } = layoutControls;
  const enabledKeys = useMemo(
    () =>
      new Set<AnalyticsMetricKey>([
        'kpis',
        ...layout.cards.filter((item) => item.visible).map((item) => item.key),
      ]),
    [layout.cards],
  );
  const queries = useAnalyticsMetricQueries(params, enabledKeys);
  const hasAllFailed = [...enabledKeys].every((key) => queries[key].isError);

  const handleChange = (next: AnalyticsParams) => {
    setSearchParams(serializeAnalyticsParams(next));
  };

  const handleRetryAll = () => {
    enabledKeys.forEach((key) => void queries[key].refetch());
  };

  return (
    <Page containerSize="xxl">
      <PageHeading text={__('Analytics', 'kirki-ecommerce')} />
      <PageContent>
        <Flex direction="column" gap={4} cssOverride={styles.content}>
          <AnalyticsControls
            params={params}
            onChange={handleChange}
            layoutControls={layoutControls}
            amountExample={queries.kpis.data?.meta.amount_example}
          />
          {hasAllFailed ? (
            <QueryErrorState onRetry={handleRetryAll} />
          ) : (
            <AmountFormatProvider format={layout.amounts}>
              <MetricsContent queries={queries} params={params} layoutControls={layoutControls} />
            </AmountFormatProvider>
          )}
        </Flex>
      </PageContent>
    </Page>
  );
};

Analytics.displayName = 'Analytics';

export default Analytics;

const styles = defineStyles({
  content: {
    paddingBottom: theme.spacing[8],
  },
  kpis: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: theme.spacing[4],
    '@media (max-width: 1100px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@media (max-width: 599px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  cards: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing[4],
  },
  kpiError: {
    gridColumn: '1 / -1',
    padding: theme.spacing[4],
    boxSizing: 'border-box',
  },
  banner: {
    padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.analytics.status.warningSubtleBackground,
  },
});
