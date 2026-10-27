import { formatNumber, moneyValue } from '@/features/analytics/lib/format';
import type { AmountFormat } from '@/features/analytics/lib/layout';
import type { LocationRow } from '@/features/analytics/schemas/catalog/analytics';
import { theme } from '@/theme';

type LocationMetric = 'sales' | 'orders' | 'customers';

type NamedLocation = LocationRow & { name: string };

const LIST_LIMIT = 5;

const metricValue = (row: LocationRow, metric: LocationMetric) =>
  metric === 'sales' ? Number(row.sales_money_object.raw) : row[metric];

const metricChange = (row: LocationRow, metric: LocationMetric) => row[`${metric}_change`] ?? null;

const formatMetric = (
  row: LocationRow,
  metric: LocationMetric,
  format: AmountFormat,
): { text: string; title?: string } =>
  metric === 'sales'
    ? moneyValue(row.sales_money_object, format)
    : { text: formatNumber(row[metric]) };

const colorShare = (value: number, min: number, max: number) =>
  max <= min ? 1 : Math.sqrt(Math.max(0, value - min) / (max - min));

const locationColor = (value: number, min: number, max: number) =>
  `color-mix(in srgb, ${theme.colors.analytics.map.high} ${Math.round(colorShare(value, min, max) * 100)}%, ${theme.colors.analytics.map.low})`;

const rankLocations = <T extends NamedLocation>(rows: T[], metric: LocationMetric) =>
  rows
    .filter((row) => metricValue(row, metric) > 0)
    .sort(
      (first, second) =>
        metricValue(second, metric) - metricValue(first, metric) ||
        first.name.localeCompare(second.name),
    );

const topLocations = <T extends NamedLocation>(rows: T[], metric: LocationMetric) =>
  rankLocations(rows, metric).slice(0, LIST_LIMIT);

const locationExtremes = <T extends NamedLocation>(rows: T[], metric: LocationMetric) => {
  const ranked = rankLocations(rows, metric);

  return ranked.length === 0 ? null : { min: ranked[ranked.length - 1], max: ranked[0] };
};

export {
  colorShare,
  formatMetric,
  locationColor,
  locationExtremes,
  type LocationMetric,
  metricChange,
  metricValue,
  topLocations,
};
