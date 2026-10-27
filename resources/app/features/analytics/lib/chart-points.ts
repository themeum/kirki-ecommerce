import type {
  ChartLegendRange,
  ChartPoint,
} from '@/features/analytics/components/charts/chart-geometry';
import { type DayRange, formatRangeDates } from '@/features/analytics/lib/date-range';
import type { SeriesPoint } from '@/features/analytics/schemas/catalog/analytics';

const toChartPoints = (series: SeriesPoint[]): ChartPoint[] => {
  return series.map((point) => ({
    date: point.date,
    label: point.label,
    span_label: point.span_label,
    value: point.value ?? null,
    previous_label: point.previous_label,
    previous_span_label: point.previous_span_label,
    previous_value: point.previous_value,
  }));
};

const hasNoSeriesValues = (series: SeriesPoint[]) => {
  return series.every((point) => !point.value);
};

const toChartLegend = (
  range: DayRange | null,
  compareRange: DayRange | null,
): ChartLegendRange | null => {
  if (!range) {
    return null;
  }

  return {
    current: formatRangeDates(range.from, range.to),
    previous: compareRange ? formatRangeDates(compareRange.from, compareRange.to) : null,
  };
};

export { hasNoSeriesValues, toChartLegend, toChartPoints };
