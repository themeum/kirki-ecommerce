import { useEffect, useRef, useState } from 'react';

import QueryErrorState from '@/components/ui/query-error-state';
import Skeleton from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Text from '@/components/ui/text';
import AnalyticsCard from '@/features/analytics/components/analytics-card';
import CardEmpty from '@/features/analytics/components/card-empty';
import type { CardProps } from '@/features/analytics/components/cards/card-props';
import ChoroplethMap, { type MapArea } from '@/features/analytics/components/charts/choropleth-map';
import HBarList from '@/features/analytics/components/charts/hbar-list';
import { useMoney } from '@/features/analytics/contexts/amount-format-context';
import type { AmountFormat } from '@/features/analytics/lib/layout';
import {
  formatMetric,
  locationColor,
  locationExtremes,
  type LocationMetric,
  metricChange,
  metricValue,
  topLocations,
} from '@/features/analytics/lib/location';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import type { AnalyticsParams } from '@/features/analytics/lib/url-state';
import type { CountryRow, RegionRow } from '@/features/analytics/schemas/catalog/analytics';
import { useAnalyticsRegionsQuery } from '@/features/analytics/services/analytics';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const METRICS: LocationMetric[] = ['sales', 'orders', 'customers'];
const SKELETON_ROWS = 5;

const getMetricLabels = (): Record<LocationMetric, string> => ({
  sales: __('Sales', 'kirki-ecommerce'),
  orders: __('Orders', 'kirki-ecommerce'),
  customers: __('Customers', 'kirki-ecommerce'),
});

type SalesByLocationCardProps = CardProps<'sales_by_location'> & {
  params: AnalyticsParams;
};

const toMapCode = (numericCode: string) => numericCode.padStart(3, '0');

const toMapAreas = (countries: CountryRow[], metric: LocationMetric, format: AmountFormat) => {
  const extremes = locationExtremes(countries, metric);
  const areas: Record<string, MapArea> = {};

  if (!extremes) {
    return areas;
  }

  const min = metricValue(extremes.min, metric);
  const max = metricValue(extremes.max, metric);

  countries.forEach((country) => {
    const value = metricValue(country, metric);

    if (!country.numeric_code || value <= 0) {
      return;
    }

    areas[toMapCode(country.numeric_code)] = {
      code: country.code,
      name: country.name,
      fill: locationColor(value, min, max),
      display: formatMetric(country, metric, format).text,
      change: metricChange(country, metric),
    };
  });

  return areas;
};

const toBarItems = (
  rows: (CountryRow | RegionRow)[],
  metric: LocationMetric,
  format: AmountFormat,
  onSelect?: (code: string) => void,
  onHighlight?: (code: string, active: boolean) => void,
) =>
  rows.map((row) => {
    const code = 'code' in row ? row.code : null;
    const value = formatMetric(row, metric, format);

    return {
      key: code ?? row.name,
      label: row.name,
      value: metricValue(row, metric),
      display: value.text,
      displayTitle: value.title,
      change: metricChange(row, metric),
      onSelect: code && onSelect ? () => onSelect(code) : undefined,
      onHighlight: code && onHighlight ? (active: boolean) => onHighlight(code, active) : undefined,
    };
  });

const SalesByLocationCard = (props: SalesByLocationCardProps) => {
  const { data, isEmpty, params } = props;
  const definition = getMetricDefinitions().sales_by_location;
  const labels = getMetricLabels();
  const { format } = useMoney();
  const [metric, setMetric] = useState<LocationMetric>('sales');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const selected = data.countries.find((country) => country.code === selectedCode) ?? null;
  const regions = useAnalyticsRegionsQuery(params, selected?.code ?? null);
  const extremes = locationExtremes(data.countries, metric);
  const highlighted = selected
    ? null
    : (data.countries.find((country) => country.code === highlightedCode) ?? null);

  const select = (code: string | null) => {
    setHighlightedCode(null);
    setSelectedCode(code);
  };

  const highlight = (code: string, active: boolean) => {
    setHighlightedCode((current) => (active ? code : current === code ? null : current));
  };

  useEffect(() => {
    const body = bodyRef.current;

    if (!selected || !body) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedCode(null);
      }
    };

    body.addEventListener('keydown', handleKeyDown);

    return () => body.removeEventListener('keydown', handleKeyDown);
  }, [selected]);

  const renderRegions = () => {
    if (regions.isPending) {
      return (
        <div css={scoped(styles.skeletons)} data-testid="regions-loading">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <Skeleton key={index} width="100%" height="28px" />
          ))}
        </div>
      );
    }

    if (regions.isError) {
      return (
        <QueryErrorState onRetry={() => void regions.refetch()} isRetrying={regions.isFetching} />
      );
    }

    return <HBarList items={toBarItems(regions.data[metric], metric, format)} />;
  };

  return (
    <AnalyticsCard
      title={definition.title}
      info={definition.info}
      size="full"
      testId="card-sales_by_location"
    >
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <div ref={bodyRef} css={scoped(styles.body)}>
          <div css={scoped(styles.mapColumn)}>
            <ChoroplethMap
              label={definition.title}
              areas={toMapAreas(data.countries, metric, format)}
              selectedNumericCode={selected?.numeric_code ? toMapCode(selected.numeric_code) : null}
              rippleNumericCode={
                highlighted?.numeric_code ? toMapCode(highlighted.numeric_code) : null
              }
              onSelect={select}
            />
            <div css={scoped(styles.legend)} data-testid="location-legend">
              <Text variant="small" color="secondary">
                {labels[metric]}
              </Text>
              {extremes && (
                <>
                  <Text
                    variant="small"
                    color="subdued"
                    title={formatMetric(extremes.min, metric, format).title}
                  >
                    {formatMetric(extremes.min, metric, format).text}
                  </Text>
                  <span aria-hidden="true" css={scoped(styles.gradient)} />
                  <Text
                    variant="small"
                    color="subdued"
                    title={formatMetric(extremes.max, metric, format).title}
                  >
                    {formatMetric(extremes.max, metric, format).text}
                  </Text>
                </>
              )}
              <span aria-hidden="true" css={scoped(styles.noneSwatch)} />
              <Text variant="small" color="subdued">
                {__('None', 'kirki-ecommerce')}
              </Text>
            </div>
          </div>
          <div css={scoped(styles.listColumn)}>
            <Tabs value={metric} onValueChange={(value) => setMetric(value as LocationMetric)}>
              <TabsList aria-label={__('Location metric', 'kirki-ecommerce')}>
                {METRICS.map((item) => (
                  <TabsTrigger key={item} value={item}>
                    {labels[item]}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            {selected ? (
              <>
                <div css={scoped(styles.listHeader)}>
                  <Text variant="small" color="subdued" data-testid="regions-heading">
                    <strong css={scoped(styles.countryName)}>{selected.name}</strong>{' '}
                    {__('by region', 'kirki-ecommerce')}
                  </Text>
                  <button
                    type="button"
                    css={scoped(styles.back)}
                    onClick={() => setSelectedCode(null)}
                  >
                    {__('← All countries', 'kirki-ecommerce')}
                  </button>
                </div>
                {renderRegions()}
              </>
            ) : (
              <HBarList
                items={toBarItems(
                  topLocations(data.countries, metric),
                  metric,
                  format,
                  select,
                  highlight,
                )}
              />
            )}
          </div>
        </div>
      )}
    </AnalyticsCard>
  );
};

SalesByLocationCard.displayName = 'SalesByLocationCard';

export default SalesByLocationCard;

const styles = defineStyles({
  body: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: theme.spacing[6],
    alignItems: 'start',
    '@media (max-width: 719px)': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
  mapColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
    minWidth: 0,
  },
  listColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
    minWidth: 0,
  },
  listHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  countryName: {
    ...theme.typography.small('semibold'),
    color: theme.colors.text.primary,
  },
  back: {
    padding: 0,
    border: 'none',
    background: 'none',
    color: theme.colors.text.emphasis,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    ...theme.typography.small(),
  },
  skeletons: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  gradient: {
    display: 'inline-block',
    width: '96px',
    height: '8px',
    borderRadius: theme.radius.full,
    backgroundImage: `linear-gradient(to right, ${theme.colors.analytics.map.low}, ${theme.colors.analytics.map.high})`,
  },
  noneSwatch: {
    display: 'inline-block',
    width: '16px',
    height: '8px',
    marginLeft: theme.spacing[3],
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.analytics.map.empty,
  },
});
