import Text from '@/components/ui/text';
import AnalyticsCard from '@/features/analytics/components/analytics-card';
import CardEmpty from '@/features/analytics/components/card-empty';
import CardHeadline from '@/features/analytics/components/card-headline';
import type { CardProps } from '@/features/analytics/components/cards/card-props';
import BarChart from '@/features/analytics/components/charts/bar-chart';
import { toChartLegend, toChartPoints } from '@/features/analytics/lib/chart-points';
import { formatNumber } from '@/features/analytics/lib/format';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';
import { _n, sprintf } from '@/wpi18n';

const OrdersOverTimeCard = (props: CardProps<'orders_over_time'>) => {
  const { data, isEmpty, range, compareRange } = props;
  const definition = getMetricDefinitions().orders_over_time;
  const itemsOrdered = data.items_ordered ?? 0;

  return (
    <AnalyticsCard title={definition.title} info={definition.info} testId="card-orders_over_time">
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <>
          <CardHeadline value={formatNumber(data.total.current)} change={data.total.change} />
          <Text variant="tiny" color="subdued">
            {sprintf(
              /* translators: %s: number of items ordered */
              _n('%s item ordered', '%s items ordered', itemsOrdered, 'kirki-ecommerce'),
              formatNumber(itemsOrdered),
            )}
          </Text>
          <BarChart
            label={definition.title}
            points={toChartPoints(data.series)}
            formatValue={formatNumber}
            legend={toChartLegend(range, compareRange)}
            showPreviousBars
          />
        </>
      )}
    </AnalyticsCard>
  );
};

OrdersOverTimeCard.displayName = 'OrdersOverTimeCard';

export default OrdersOverTimeCard;
