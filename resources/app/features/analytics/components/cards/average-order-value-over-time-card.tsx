import AnalyticsCard from '@/features/analytics/components/analytics-card';
import CardEmpty from '@/features/analytics/components/card-empty';
import CardHeadline from '@/features/analytics/components/card-headline';
import type { CardProps } from '@/features/analytics/components/cards/card-props';
import LineChart from '@/features/analytics/components/charts/line-chart';
import { useMoney } from '@/features/analytics/contexts/amount-format-context';
import { toChartLegend, toChartPoints } from '@/features/analytics/lib/chart-points';
import { getMetricDefinitions } from '@/features/analytics/lib/metric-definitions';

const AverageOrderValueOverTimeCard = (props: CardProps<'average_order_value_over_time'>) => {
  const { data, isEmpty, formatMinor, formatMinorShort, range, compareRange } = props;
  const definition = getMetricDefinitions().average_order_value_over_time;
  const total = useMoney().money(data.total.current_money_object);

  return (
    <AnalyticsCard
      title={definition.title}
      info={definition.info}
      testId="card-average_order_value_over_time"
    >
      {isEmpty ? (
        <CardEmpty />
      ) : (
        <>
          <CardHeadline value={total.text} valueTitle={total.title} change={data.total.change} />
          <LineChart
            label={definition.title}
            points={toChartPoints(data.series)}
            formatValue={formatMinor}
            formatAxisValue={formatMinorShort}
            legend={toChartLegend(range, compareRange)}
            showPoints
            showArea={false}
          />
        </>
      )}
    </AnalyticsCard>
  );
};

AverageOrderValueOverTimeCard.displayName = 'AverageOrderValueOverTimeCard';

export default AverageOrderValueOverTimeCard;
