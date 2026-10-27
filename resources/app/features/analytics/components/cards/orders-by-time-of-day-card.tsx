import { useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Text from '@/components/ui/text';
import AnalyticsCard from '@/features/analytics/components/analytics-card';
import CardEmpty from '@/features/analytics/components/card-empty';
import type { CardProps } from '@/features/analytics/components/cards/card-props';
import DotGrid, { type DotGridMode } from '@/features/analytics/components/charts/dot-grid';
import { toChartLegend } from '@/features/analytics/lib/chart-points';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import {
  formatHour,
  formatHourSpan,
  summarizeTimeOfDay,
} from '@/features/analytics/lib/time-of-day';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const getWeekdayNames = () => ({
  short: [
    __('Mon', 'kirki-ecommerce'),
    __('Tue', 'kirki-ecommerce'),
    __('Wed', 'kirki-ecommerce'),
    __('Thu', 'kirki-ecommerce'),
    __('Fri', 'kirki-ecommerce'),
    __('Sat', 'kirki-ecommerce'),
    __('Sun', 'kirki-ecommerce'),
  ],
  long: [
    __('Monday', 'kirki-ecommerce'),
    __('Tuesday', 'kirki-ecommerce'),
    __('Wednesday', 'kirki-ecommerce'),
    __('Thursday', 'kirki-ecommerce'),
    __('Friday', 'kirki-ecommerce'),
    __('Saturday', 'kirki-ecommerce'),
    __('Sunday', 'kirki-ecommerce'),
  ],
});

type LegendItem = {
  key: string;
  text: string;
  colors: string[];
};

const OrdersByTimeOfDayCard = (props: CardProps<'orders_by_time_of_day'>) => {
  const { data, isEmpty, range, compareRange } = props;
  const definition = getMetricDefinitions().orders_by_time_of_day;
  const [selectedMode, setSelectedMode] = useState<DotGridMode>('current');
  const weekdays = getWeekdayNames();
  const summary = summarizeTimeOfDay(data.current);
  const hasComparison = !!compareRange && !!data.previous;
  const mode = hasComparison ? selectedMode : 'current';
  const comparisonSpan = toChartLegend(range, compareRange)?.previous ?? '';

  const legend: LegendItem[] =
    mode === 'change'
      ? [
          {
            key: 'more',
            text: sprintf(__('More than %s', 'kirki-ecommerce'), comparisonSpan),
            colors: [theme.colors.analytics.heatmap.increase],
          },
          {
            key: 'fewer',
            text: __('Fewer', 'kirki-ecommerce'),
            colors: [theme.colors.analytics.heatmap.decrease],
          },
          { key: 'size', text: __('Bigger dot, bigger change', 'kirki-ecommerce'), colors: [] },
        ]
      : [
          {
            key: 'more',
            text: __('Bigger, darker dot = more', 'kirki-ecommerce'),
            colors: [theme.colors.analytics.chart.mid, theme.colors.analytics.chart.primary],
          },
          {
            key: 'totals',
            text: __('Numbers on the right: total per day', 'kirki-ecommerce'),
            colors: [],
          },
        ];

  return (
    <AnalyticsCard
      title={definition.title}
      info={definition.info}
      size="full"
      testId="card-orders_by_time_of_day"
    >
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <>
          <div css={scoped(styles.header)}>
            <dl css={scoped(styles.stats)} data-testid="time-of-day-summary">
              <div css={scoped(styles.stat)}>
                <dt>{__('Busiest hour', 'kirki-ecommerce')}</dt>
                <dd css={scoped(styles.value)}>
                  {`${weekdays.short[summary.busiestHourDay]} ${formatHourSpan(summary.busiestHour)}`}
                </dd>
              </div>
              <div css={scoped(styles.stat)}>
                <dt>{__('Busiest day', 'kirki-ecommerce')}</dt>
                <dd css={scoped(styles.value)}>{weekdays.long[summary.busiestDay]}</dd>
              </div>
              <div css={scoped(styles.stat)}>
                <dt>{sprintf(__('After %s', 'kirki-ecommerce'), formatHour(summary.busiestHour))}</dt>
                <dd css={scoped(styles.share)}>
                  <strong css={scoped(styles.value)}>{`${summary.afterPercent}%`}</strong>{' '}
                  {__('of orders', 'kirki-ecommerce')}
                </dd>
              </div>
            </dl>
            {hasComparison && (
              <Tabs value={mode} onValueChange={(value) => setSelectedMode(value as DotGridMode)}>
                <TabsList aria-label={__('Dot view', 'kirki-ecommerce')}>
                  <TabsTrigger value="current">{__('This period', 'kirki-ecommerce')}</TabsTrigger>
                  <TabsTrigger value="change">{__('Change', 'kirki-ecommerce')}</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          </div>
          <DotGrid
            label={definition.title}
            counts={data.current}
            previous={data.previous}
            mode={mode}
            dayLabels={weekdays.short}
            dayTotals={summary.dayTotals}
          />
          <ul css={scoped(styles.legend)} data-testid="time-of-day-legend">
            {legend.map((item) => (
              <li key={item.key} css={scoped(styles.legendItem)}>
                {item.colors.map((color, index) => (
                  <span
                    key={color}
                    aria-hidden="true"
                    css={scoped(styles.legendDot)}
                    style={{
                      backgroundColor: color,
                      width: `${6 + index * 4}px`,
                      height: `${6 + index * 4}px`,
                    }}
                  />
                ))}
                <Text variant="small" color={item.colors.length ? 'secondary' : 'subdued'}>
                  {item.text}
                </Text>
              </li>
            ))}
          </ul>
        </>
      )}
    </AnalyticsCard>
  );
};

OrdersByTimeOfDayCard.displayName = 'OrdersByTimeOfDayCard';

export default OrdersByTimeOfDayCard;

const styles = defineStyles({
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[3],
  },
  stats: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing[5],
    margin: 0,
  },
  stat: {
    display: 'flex',
    gap: theme.spacing[1],
    margin: 0,
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
    '& dt, & dd': {
      margin: 0,
    },
  },
  value: {
    ...theme.typography.small('semibold'),
    color: theme.colors.text.primary,
  },
  share: {
    margin: 0,
  },
  legend: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing[4],
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    margin: 0,
  },
  legendDot: {
    display: 'inline-block',
    flexShrink: 0,
    borderRadius: '50%',
  },
});
